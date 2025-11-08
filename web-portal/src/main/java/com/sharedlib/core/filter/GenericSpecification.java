package com.sharedlib.core.filter;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * STEP 1 - Purpose of this class:
 * GenericSpecification is responsible for translating a single SearchCriteria
 * into a JPA Criteria API Predicate that can be executed by the database.
 *
 * When to use:
 * - Used internally by GenericSpecificationBuilder to build a complete Specification
 *   combining multiple search criteria, scopes, and groups.
 *
 * Execution flow:
 * 1. The filter request contains multiple SearchCriteria objects.
 * 2. For each SearchCriteria, a GenericSpecification is created.
 * 3. Each GenericSpecification produces a Predicate using toPredicate().
 * 4. All predicates are combined in the Specification chain for final query execution.
 */
@RequiredArgsConstructor
public class GenericSpecification<T> implements Specification<T> {

    private static final Pattern UUID_PATTERN = Pattern.compile("(?i)\\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\\b");

    /**
     * STEP 2 - criteria:
     * This object contains:
     * - field key (column name)
     * - operation type (EQUAL, LIKE, GREATER_THAN, etc.)
     * - value(s) to compare
     * - expected data type (STRING, UUID, DATE, etc.)
     */
    private final SearchCriteria criteria;

    /**
     * STEP 3 - toPredicate():
     * Converts the SearchCriteria into a Predicate using CriteriaBuilder.
     * This method is called by Spring Data JPA when executing the Specification.
     */
    @Override
    public Predicate toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        Path<?> path = resolvePath(root, criteria.getKey()); // supports nested "user.id"

        Object value = convertValue(criteria.getValue(), criteria.getDataType());
        Object valueTo = convertValue(criteria.getValueTo(), criteria.getDataType());

        switch (criteria.getOperation()) {
            case EQUAL:
                return cb.equal(path, value);
            case NOT_EQUAL:
                return cb.notEqual(path, value);
            case GREATER_THAN:
                return cb.greaterThan((Expression<Comparable>) path, (Comparable) value);
            case GREATER_THAN_EQUAL:
                return cb.greaterThanOrEqualTo((Expression<Comparable>) path, (Comparable) value);
            case LESS_THAN:
                return cb.lessThan((Expression<Comparable>) path, (Comparable) value);
            case LESS_THAN_EQUAL:
                return cb.lessThanOrEqualTo((Expression<Comparable>) path, (Comparable) value);
            case BETWEEN:
                return cb.between((Expression<Comparable>) path, (Comparable) value, (Comparable) valueTo);
            case LIKE: {
                Expression<String> s = path.as(String.class);
                return cb.like(cb.lower(s), "%" + String.valueOf(value).toLowerCase() + "%");
            }
            case STARTS_WITH: {
                Expression<String> s = path.as(String.class);
                return cb.like(cb.lower(s), String.valueOf(value).toLowerCase() + "%");
            }
            case ENDS_WITH: {
                Expression<String> s = path.as(String.class);
                return cb.like(cb.lower(s), "%" + String.valueOf(value).toLowerCase());
            }
            case IN: {
                Collection<?> col = convertCollection(criteria.getValue(), criteria.getDataType());
                CriteriaBuilder.In<Object> in = cb.in(path);
                for (Object v : col) {
                    in.value(v);
                }
                return in;
            }
            case NOT_IN: {
                Collection<?> col = convertCollection(criteria.getValue(), criteria.getDataType());
                CriteriaBuilder.In<Object> in = cb.in(path);
                for (Object v : col) {
                    in.value(v);
                }
                return cb.not(in);
            }
            case IS_NULL:
                return cb.isNull(path);
            case IS_NOT_NULL:
                return cb.isNotNull(path);
            default:
                return cb.conjunction();
        }
    }

    /** Supports dotted paths like "user.id" with auto-joins for JPA relationships */
    private Path<?> resolvePath(From<?, ?> root, String dottedPath) {
        String[] parts = dottedPath.split("\\.");
        Path<?> current = root;
        From<?, ?> from = root;
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i];
            if (i < parts.length - 1) {
                from = (From<?, ?>) from.join(p, JoinType.LEFT);
                current = from;
            } else {
                current = current.get(p);
            }
        }
        return current;
    }

    /**
     * STEP 5 - convertValue():
     * Safely converts the input value from String/Object into the correct Java type.
     * This prevents type mismatch errors when building the query.
     */
    private Object convertValue(Object value, ValueDataType type) {
        if (value == null) {
            return null;
        }
        switch (type) {
            case UUID:
                return convertUuid(value);
            case NUMBER:
                // Keep numeric as BigDecimal to be safe across DBs
                return new java.math.BigDecimal(value.toString());
            case BOOLEAN:
                return Boolean.valueOf(value.toString());
            case DATE:
                return java.time.LocalDate.parse(value.toString());
            case INSTANT:
                return java.time.Instant.parse(value.toString());
            case OFFSET_DATE_TIME:
                return java.time.OffsetDateTime.parse(value.toString());
            case ENUM:
                return convertEnum(value, criteria.getEnumClassFqn());
            case STRING:
            default:
                return value.toString();
        }
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    private Object convertEnum(Object value, String enumFqn) {
        if (enumFqn == null || enumFqn.isBlank()) {
            throw new IllegalArgumentException("enumClassFqn is required for ENUM data type");
        }
        try {
            Class<?> clazz = Class.forName(enumFqn);
            if (!clazz.isEnum()) {
                throw new IllegalArgumentException(enumFqn + " is not an enum");
            }
            return Enum.valueOf((Class<? extends Enum>) clazz, value.toString());
        } catch (ClassNotFoundException e) {
            throw new IllegalArgumentException("Enum class not found: " + enumFqn);
        }
    }

    private Collection<?> convertCollection(Object value, ValueDataType type) {
        if (value == null) {
            return List.of();
        }

        Collection<?> raw;
        if (value instanceof Collection<?>) {
            raw = (Collection<?>) value;
        } else if (value.getClass().isArray()) {
            int len = Array.getLength(value);
            List<Object> tmp = new ArrayList<>(len);
            for (int i = 0; i < len; i++) {
                tmp.add(Array.get(value, i));
            }
            raw = tmp;
        } else if (value instanceof CharSequence) {
            raw = parseDelimitedString(value.toString());
        } else {
            raw = List.of(value);
        }

        List<Object> out = new ArrayList<>(raw.size());
        for (Object v : raw) {
            Object converted = convertValue(v, type);
            if (converted != null) {
                out.add(converted);
            }
        }
        return out;
    }

    private Collection<String> parseDelimitedString(String raw) {
        String trimmed = raw == null ? "" : raw.trim();
        if (trimmed.isEmpty()) {
            return List.of();
        }
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (!trimmed.contains(",")) {
            return List.of(trimmed);
        }
        String[] parts = trimmed.split(",");
        List<String> tokens = new ArrayList<>(parts.length);
        for (String part : parts) {
            String token = part.trim();
            if (!token.isEmpty()) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private UUID convertUuid(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof UUID uuid) {
            return uuid;
        }

        if (value instanceof CharSequence sequence) {
            String candidate = sequence.toString().trim();
            if (candidate.isEmpty()) {
                return null;
            }
            candidate = resolveUuidString(candidate);
            return parseUuid(candidate, value);
        }

        if (value instanceof Map<?, ?> map) {
            Object candidate = firstNonNull(map.get("id"), map.get("uuid"), map.get("value"));
            if (candidate == null && map.size() == 1) {
                candidate = map.values().iterator().next();
            }
            if (candidate != null) {
                return convertUuid(candidate);
            }
            throw invalidUuid(value);
        }

        if (value.getClass().isArray() && Array.getLength(value) > 0) {
            return convertUuid(Array.get(value, 0));
        }

        return parseUuid(value.toString(), value);
    }

    private String resolveUuidString(String raw) {
        if (raw.length() <= 36) {
            return raw;
        }
        Matcher matcher = UUID_PATTERN.matcher(raw);
        if (matcher.find()) {
            return matcher.group();
        }
        return raw;
    }

    private UUID parseUuid(String candidate, Object original) {
        try {
            return UUID.fromString(candidate);
        } catch (IllegalArgumentException ex) {
            throw invalidUuid(original);
        }
    }

    private RuntimeException invalidUuid(Object value) {
        String fieldName = Optional.ofNullable(criteria)
                .map(SearchCriteria::getKey)
                .orElse("unknown");
        String message = "Invalid UUID value for field '" + fieldName + "': " + String.valueOf(value);
        return new IllegalArgumentException(message);
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}

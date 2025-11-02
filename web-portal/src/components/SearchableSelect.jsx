import React from 'react'
import Select from 'react-select'

/**
 * Searchable Select Component using react-select
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of {value, label} objects
 * @param {any} props.value - Selected value
 * @param {Function} props.onChange - Change handler (value, option) => void
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.isDisabled - Disabled state
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isClearable - Show clear button
 * @param {boolean} props.isSearchable - Enable search (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  isDisabled = false,
  isLoading = false,
  isClearable = true,
  isSearchable = true,
  className = '',
  ...rest
}) => {
  // Find the selected option object from value
  const selectedOption = options.find(opt => opt.value === value) || null

  // Handle change - extract just the value
  const handleChange = (selectedOption) => {
    onChange(selectedOption?.value || null, selectedOption)
  }

  // Custom styles to match your design
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
      },
      minHeight: '38px',
      borderRadius: '0.375rem',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#dbeafe' 
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#2563eb',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
  }

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable={isClearable}
      isSearchable={isSearchable}
      styles={customStyles}
      className={className}
      noOptionsMessage={() => 'No options found'}
      loadingMessage={() => 'Loading...'}
      {...rest}
    />
  )
}

export default SearchableSelect



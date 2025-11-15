/**
 * System Section Constants
 * Maps section names to their systemSectionIds from the permissions API
 * Used to filter scope-based access at the section level
 */

export const SYSTEM_SECTIONS = {
  // Appointment Service Sections
  APPOINTMENT_SCHEDULING: '22d028fe-c2da-4ed3-a41d-812f69bda468', // Appointment Scheduling and Calendars
  APPOINTMENT_REPORTING_AND_ANALYTICS: 'd19a23ec-b2dc-4d2a-8085-3e519e29715b', // Reporting and Analytics
  Appointment_DAILY_ENTRY:'64ff9634-92ad-4eb0-bab9-68510193ab98',
  Appointment_SETUP_AND_CONFIGURATION:'01368aaa-5760-49bb-ace3-efe6f124b5de',
  Appointment_USERS:'46f17898-5368-4419-8a7a-d279c6317d25',
  Appointment_Reference_Data:'ff960ce9-e515-4253-aa47-310df90025ca',
  // Add more sections as they are used in other pages
  // Example format:
  // SECTION_NAME: 'uuid-from-permissions-api',
}

/**
 * Reverse mapping: systemSectionId to section name (optional, for debugging)
 */
export const SYSTEM_SECTIONS_BY_ID = Object.entries(SYSTEM_SECTIONS).reduce(
  (acc, [name, id]) => {
    acc[id] = name
    return acc
  },
  {}
)

export default SYSTEM_SECTIONS

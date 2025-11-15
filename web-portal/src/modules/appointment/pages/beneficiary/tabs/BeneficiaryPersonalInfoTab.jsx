import React from 'react'
import { User, Calendar, Phone, Mail, MapPin, ExternalLink } from 'lucide-react'

export default function BeneficiaryPersonalInfoTab({ beneficiary }) {
  const hasCoordinates =
    beneficiary.latitude !== null &&
    beneficiary.latitude !== undefined &&
    beneficiary.latitude !== '' &&
    beneficiary.longitude !== null &&
    beneficiary.longitude !== undefined &&
    beneficiary.longitude !== ''

  const formattedLatitude = hasCoordinates ? Number(beneficiary.latitude).toFixed(6) : null
  const formattedLongitude = hasCoordinates ? Number(beneficiary.longitude).toFixed(6) : null
  const locationLink = hasCoordinates
    ? `https://www.google.com/maps?q=${beneficiary.latitude},${beneficiary.longitude}`
    : null
  const locationEmbedUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${beneficiary.latitude},${beneficiary.longitude}&z=15&output=embed`
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="font-medium">{beneficiary.fullName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Mother Name</p>
            <p className="font-medium">{beneficiary.motherName || '-'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Date of Birth</p>
            <p className="font-medium">
              {beneficiary.dateOfBirth ? new Date(beneficiary.dateOfBirth).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">National ID</p>
            <p className="font-medium font-mono text-sm">{beneficiary.nationalId || '-'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Gender</p>
            <p className="font-medium">{beneficiary.genderCodeValueId || '-'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Mobile</p>
            <p className="font-medium font-mono">{beneficiary.mobileNumber}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium">{beneficiary.email || '-'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Address</p>
            <p className="font-medium">{beneficiary.address || '-'}</p>
          </div>
        </div>

        {hasCoordinates && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-sm font-mono">
                {formattedLatitude}, {formattedLongitude}
              </p>
              {locationLink && (
                <a
                  href={locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Maps
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="md:col-span-2 border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Preferred Language</p>
            <p className="font-medium">{beneficiary.preferredLanguageCodeValueId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Registration Status</p>
            <p className="font-medium">{beneficiary.registrationStatusCodeValueId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created At</p>
            <p className="font-medium text-sm">
              {beneficiary.createdAt ? new Date(beneficiary.createdAt).toLocaleString() : '-'}
            </p>
          </div>
        </div>
      </div>

      {hasCoordinates && locationEmbedUrl && (
        <div className="md:col-span-2 border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <iframe
              title="Beneficiary Location Map"
              src={locationEmbedUrl}
              className="w-full h-80"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  )
}

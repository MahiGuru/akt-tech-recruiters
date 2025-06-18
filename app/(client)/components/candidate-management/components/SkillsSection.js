// app/(client)/components/candidate-card/components/SkillsSection.js
'use client'

import { getTruncatedSkills } from '../utils/candidate-data-helpers'

const SkillsSection = ({ candidate, maxSkills = 8 }) => {
  const { visible, remaining } = getTruncatedSkills(candidate.skills, maxSkills)

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
      {visible.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {visible.map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
            >
              {skill}
            </span>
          ))}
          {remaining > 0 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              +{remaining} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No skills listed</p>
      )}
    </div>
  )
}

export default SkillsSection
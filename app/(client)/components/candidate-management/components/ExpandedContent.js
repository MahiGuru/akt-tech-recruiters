// app/(client)/components/candidate-card/components/ExpandedContent.js
'use client'

import { motion } from 'framer-motion'
import { FileText, Briefcase, TrendingUp } from 'lucide-react'
import SkillsSection from './SkillsSection'

const ExpandedContent = ({ candidate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4 border-t border-gray-200 pt-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        <SkillsSection candidate={candidate} />

        {/* Quick Stats */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">
            Additional Info
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>
                {candidate.resumes?.length || 0} resume
                {candidate.resumes?.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span>
                {candidate.applications?.length || 0} application
                {candidate.applications?.length !== 1 ? "s" : ""}
              </span>
            </div>
            {candidate.experience && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span>{candidate.experience} years experience</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio and Notes */}
      {(candidate.bio || candidate.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidate.bio && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
              <p className="text-sm text-gray-600">{candidate.bio}</p>
            </div>
          )}
          {candidate.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{candidate.notes}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default ExpandedContent
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function QuickStatusModal({ open, candidate, candidateStatuses, onClose, onStatusChange }) {
  if (!open || !candidate) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Update Status</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Candidate:</h4>
            <p className="text-sm text-gray-600">
              <strong>{candidate.name}</strong> ({candidate.email})
            </p>
          </div>
          <div>
            <label className="form-label">Select New Status</label>
            <div className="space-y-2">
              {candidateStatuses.map(status => {
                const Icon = require("lucide-react")[status.icon];
                const isCurrentStatus = status.value === candidate.status;
                return (
                  <button
                    key={status.value}
                    onClick={() => !isCurrentStatus && onStatusChange(candidate.id, status.value, candidate.name)}
                    disabled={isCurrentStatus}
                    className={`w-full p-4 text-left border rounded-lg transition-colors ${
                      isCurrentStatus
                        ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-50"
                        : "border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{status.label}</div>
                        <div className="text-sm text-gray-600">{status.description}</div>
                      </div>
                      {isCurrentStatus && (
                        <span className="ml-auto text-xs text-gray-500">(Current)</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
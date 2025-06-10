// components/JobDescriptionRenderer.js
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const JobDescriptionRenderer = ({ description, maxLength = 300 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Function to strip HTML tags for length calculation
  const stripHtml = (html) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Function to truncate HTML content while preserving structure
  const truncateHtml = (html, maxLength) => {
    const plainText = stripHtml(html)
    if (plainText.length <= maxLength) return html

    // Simple truncation approach - you might want a more sophisticated HTML-aware truncation
    const truncatedText = plainText.substring(0, maxLength)
    const lastSpace = truncatedText.lastIndexOf(' ')
    const finalLength = lastSpace > 0 ? lastSpace : maxLength
    
    // For now, we'll just truncate the plain text and add ellipsis
    return plainText.substring(0, finalLength) + '...'
  }

  const shouldTruncate = stripHtml(description || '').length > maxLength
  const displayContent = isExpanded || !shouldTruncate 
    ? description 
    : truncateHtml(description, maxLength)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="job-description">
      <div 
        className="text-gray-700 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: isExpanded || !shouldTruncate ? description : truncateHtml(description, maxLength)
        }}
      />
      
      {shouldTruncate && (
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Read more</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      <style jsx>{`
        .job-description :global(h1) {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 1rem 0 0.5rem 0;
        }
        
        .job-description :global(h2) {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin: 0.875rem 0 0.5rem 0;
        }
        
        .job-description :global(h3) {
          font-size: 1.125rem;
          font-weight: 600;
          color: #4b5563;
          margin: 0.75rem 0 0.5rem 0;
        }
        
        .job-description :global(p) {
          margin: 0.5rem 0;
          line-height: 1.6;
          color: #374151;
        }
        
        .job-description :global(ul) {
          list-style-type: none;
          padding-left: 0;
          margin: 0.75rem 0;
        }
        
        .job-description :global(ul li) {
          position: relative;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          color: #374151;
          line-height: 1.5;
        }
        
        .job-description :global(ul li::before) {
          content: "•";
          color: #3b82f6;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .job-description :global(ol) {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
          color: #374151;
        }
        
        .job-description :global(ol li) {
          margin: 0.5rem 0;
          line-height: 1.5;
        }
        
        .job-description :global(strong),
        .job-description :global(b) {
          font-weight: 700;
          color: #1f2937;
        }
        
        .job-description :global(em),
        .job-description :global(i) {
          font-style: italic;
          color: #4b5563;
        }
        
        .job-description :global(mark) {
          background-color: #fef08a;
          color: #92400e;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }
        
        .job-description :global(blockquote) {
          border-left: 4px solid #3b82f6;
          background-color: #eff6ff;
          padding: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #1e40af;
          border-radius: 0.5rem;
        }
        
        .job-description :global(a) {
          color: #2563eb;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .job-description :global(a:hover) {
          color: #1d4ed8;
        }
        
        /* Highlight key phrases */
        .job-description :global(*:contains("requirement")),
        .job-description :global(*:contains("responsibility")),
        .job-description :global(*:contains("key")) {
          color: #059669;
          font-weight: 500;
        }
        
        /* Style for benefits and perks */
        .job-description :global(*:contains("benefit")),
        .job-description :global(*:contains("perk")),
        .job-description :global(*:contains("offer")) {
          color: #7c3aed;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

export default JobDescriptionRenderer
import { useState, useEffect } from 'react'

export function useTypewriter(textArray, speed = 30) {
  const [displayedText, setDisplayedText] = useState([])

  useEffect(() => {
    let currentLine = 0
    let currentChar = 0
    
    // Clear state when textArray changes
    setDisplayedText([])
    
    const interval = setInterval(() => {
      if (currentLine >= textArray.length) {
        clearInterval(interval)
        return
      }

      setDisplayedText((prev) => {
        // Create a copy of the previous state
        const newLines = [...prev]
        
        // Ensure the line exists
        if (!newLines[currentLine]) newLines[currentLine] = ''
        
        // Add the character
        newLines[currentLine] += textArray[currentLine][currentChar] || ''
        
        return newLines
      })

      currentChar++

      // Move to next line if current line is finished
      if (textArray[currentLine] && currentChar >= textArray[currentLine].length) {
        currentLine++
        currentChar = 0
      }
    }, speed)

    return () => clearInterval(interval)
  }, [textArray, speed])

  return { displayedText }
}
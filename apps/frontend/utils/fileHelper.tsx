export const getLanguageFromFilename = (filename: string) => {
  const ext = filename?.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    css: 'css',
    xml: 'xml',
    html: 'xml',
  }
  return languageMap[ext || ''] || 'plaintext'
}

export const minifyCode = (code: string) =>
  code
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Replace multiple whitespace with a single space
    .replace(/\s*([{};,:])\s*/g, '$1') // Remove spaces around specific characters
    .trim()

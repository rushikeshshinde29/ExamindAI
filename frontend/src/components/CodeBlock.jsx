import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BsCopy, BsCheck, BsFileEarmarkCode } from 'react-icons/bs';

export default function CodeBlock({ text, isStudentExamView = false }) {
  const [copiedText, setCopiedText] = useState(null);

  const handleCopy = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedText(index);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderCode = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = String(children).replace(/\n$/, '');
    const language = match ? match[1] : '';

    const isInline = inline || (!match && !codeContent.includes('\n'));

    if (isInline) {
      return (
        <code 
          className="codeBlockInline font-mono" 
          style={{ 
            background: 'var(--bg-raised, #f1f5f9)', 
            border: '1px solid var(--bg-border, #cbd5e1)', 
            color: 'var(--primary, #6850DB)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '0.85em',
            margin: '0 2px'
          }} 
          {...props}
        >
          {children}
        </code>
      );
    }

    const blockIndex = node.position?.start?.line || Math.random();
    const isCopied = copiedText === blockIndex;

    // Determine filename dynamically
    let fileName = 'Solution.txt';
    if (language) {
      const lang = language.toLowerCase();
      if (lang === 'java') fileName = 'Solution.java';
      else if (lang === 'javascript' || lang === 'js') fileName = 'Solution.js';
      else if (lang === 'python' || lang === 'py') fileName = 'Solution.py';
      else if (lang === 'cpp' || lang === 'c++') fileName = 'Solution.cpp';
      else if (lang === 'c') fileName = 'Solution.c';
      else if (lang === 'html') fileName = 'index.html';
      else if (lang === 'css') fileName = 'styles.css';
      else if (lang === 'sql') fileName = 'query.sql';
      else fileName = `Solution.${lang}`;
    }

    return (
      <div 
        className={`codeBlockContainer my-4 border border-slate-700/60 rounded-md overflow-hidden shadow-xl max-w-full transition-all ${isStudentExamView ? 'select-none' : ''}`}
        onCopy={isStudentExamView ? (e) => e.preventDefault() : undefined}
        onCut={isStudentExamView ? (e) => e.preventDefault() : undefined}
        onContextMenu={isStudentExamView ? (e) => e.preventDefault() : undefined}
      >
        {/* VS Code Sleek Header Bar */}
        <div className="flex items-center justify-between pl-6 pr-4 py-2.5 bg-[#181825] border-b border-slate-700/60 select-none">
          {/* Controls + File Badge */}
          <div className="flex items-center gap-3">
            {/* Mac-style Window controls */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            
            {/* File icon & file name */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/40 text-[10px] font-mono text-slate-300">
              <BsFileEarmarkCode size={11} className="text-purple-400" />
              <span>{fileName}</span>
            </div>
          </div>
          
          {/* Copy Button (Only if not in Student Exam View) */}
          {!isStudentExamView && (
            <button
              type="button"
              onClick={() => handleCopy(codeContent, blockIndex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                color: isCopied ? '#34d399' : '#94a3b8',
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'sans-serif',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#64748b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b';
                e.currentTarget.style.color = isCopied ? '#34d399' : '#94a3b8';
                e.currentTarget.style.borderColor = '#475569';
              }}
            >
              {isCopied ? (
                <>
                  <BsCheck size={13} style={{ color: '#34d399' }} />
                  <span style={{ color: '#34d399', fontWeight: '600' }}>Copied!</span>
                </>
              ) : (
                <>
                  <BsCopy size={11} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Syntax Highlighted Body with VS Code theme colors */}
        <div className="overflow-x-auto text-sm">
          <SyntaxHighlighter
            style={atomDark}
            language={language || 'text'}
            PreTag="div"
            showLineNumbers={true}
            customStyle={{
              margin: 0,
              padding: '16px',
              background: '#1e1e2e', // VS Code style background
              fontSize: '0.85rem',
              lineHeight: '1.6',      // Increased line height
            }}
            lineNumberStyle={{
              color: '#585b70',
              minWidth: '2.5em',
              paddingRight: '1.5em',
              textAlign: 'right',
              userSelect: 'none',
            }}
            {...props}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  return (
    <ReactMarkdown
      components={{
        code: renderCode
      }}
    >
      {text || ''}
    </ReactMarkdown>
  );
}

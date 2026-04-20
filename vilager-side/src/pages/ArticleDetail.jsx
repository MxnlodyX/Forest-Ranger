import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function resolveImage(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob')) return path;
  return `${API_BASE}${path}`;
}

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

// EditorJS block renderer (ฝั่ง viewer เท่านั้น — ไม่ต้องการ EditorJS library)
function ContentRenderer({ content }) {
  if (!content || !content.blocks) return null;
  return (
    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
      {content.blocks.map((block, i) => {
        switch (block.type) {
          case 'header': {
            const Tag = `h${block.data.level}`;
            return <Tag key={i} className="font-bold text-gray-900 mt-6 mb-2" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
          }
          case 'paragraph':
            return <p key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
          case 'list': {
            const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={i} className={block.data.style === 'ordered' ? 'list-decimal pl-6 mb-4' : 'list-disc pl-6 mb-4'}>
                {block.data.items.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ListTag>
            );
          }
          case 'quote':
            return (
              <blockquote key={i} className="border-l-4 border-green-500 pl-4 italic my-6 bg-green-50 py-3 rounded-r-lg">
                <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                {block.data.caption && <cite className="text-xs text-gray-500 block mt-1">— {block.data.caption}</cite>}
              </blockquote>
            );
          case 'code':
            return (
              <pre key={i} className="bg-gray-900 text-green-400 p-4 rounded-lg my-4 overflow-x-auto text-sm">
                <code>{block.data.code}</code>
              </pre>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/knowledge/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(setResource)
      .catch(() => setError('ไม่พบข้อมูลสื่อความรู้นี้'))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl grow">
        <button
          onClick={() => navigate('/knowledge')}
          className="mb-6 flex items-center gap-2 text-sm text-green-700 font-semibold hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
          กลับไปยังรายการสื่อความรู้
        </button>

        {isLoading && (
          <div className="text-center py-24 text-gray-400">กำลังโหลด...</div>
        )}

        {error && (
          <div className="text-center py-24 text-rose-500 font-semibold">{error}</div>
        )}

        {resource && !isLoading && (
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover / Video */}
            {(resource.type === 'วิดีโอ' || resource.type === 'Video') && resource.videoUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(resource.videoUrl)}
                  className="h-full w-full"
                  allowFullScreen
                  title={resource.title}
                />
              </div>
            ) : resource.image ? (
              <img
                src={resolveImage(resource.image)}
                alt={resource.title}
                className="w-full max-h-80 object-cover"
              />
            ) : null}

            <div className="p-6 md:p-10">
              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  {resource.category}
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                  {resource.type}
                </span>
                {resource.readTime && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {resource.readTime}
                  </span>
                )}
                {resource.date && (
                  <span className="text-xs text-gray-400">{resource.date}</span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                {resource.title}
              </h1>

              {resource.excerpt && (
                <p className="text-base text-gray-500 italic border-l-4 border-green-300 pl-4 mb-8">
                  {resource.excerpt}
                </p>
              )}

              <ContentRenderer content={resource.content} />
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

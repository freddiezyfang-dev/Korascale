import { Heading } from '@/components/common';
import { renderRichTextContent } from '@/lib/articleRichText';
import type { Article } from '@/types/article';
import { renderArticleContentBlock } from './renderArticleContentBlock';

interface ArticleBodyContentProps {
  article: Article;
  contentBlocks?: Article['contentBlocks'];
}

export default function ArticleBodyContent({ article, contentBlocks }: ArticleBodyContentProps) {
  const blocks = contentBlocks ?? article.contentBlocks ?? [];
  const tagList = article.tags ?? [];
  const faqList = (article.faqs || [])
    .map((f) => ({
      question: (f.question || '').trim(),
      answer: (f.answer || '').trim(),
    }))
    .filter((f) => f.question && f.answer);

  return (
    <article className="flex-1 min-w-0 w-full article-body">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        <div className="prose prose-slate w-full max-w-none prose-headings:font-serif prose-headings:text-[#111] prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-xl md:prose-h3:text-2xl prose-p:font-sans prose-p:text-gray-800 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-[17px] prose-img:max-w-md prose-img:mx-auto prose-img:rounded-lg prose-img:shadow-md prose-img:mt-10 prose-img:mb-16">
          {blocks.length > 0
            ? blocks.map((block, index) => renderArticleContentBlock(block, index))
            : article.content &&
              renderRichTextContent(
                article.content,
                'article-body prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-[#111] prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-xl md:prose-h3:text-2xl prose-p:font-sans prose-p:text-gray-800 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-[17px] prose-img:max-w-md prose-img:mx-auto prose-img:rounded-lg prose-img:shadow-md prose-img:mt-10 prose-img:mb-16'
              )}
        </div>

        {tagList.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => {
                const label = (tag ?? '').trim();
                if (!label) return null;
                return (
                  <span
                    key={label}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 font-sans"
                    role="listitem"
                    data-tag={label}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {faqList.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <Heading level={3} className="text-xl font-heading mb-4">
              Frequently Asked Questions
            </Heading>
            <div className="space-y-3">
              {faqList.map((f, index) => (
                <details
                  key={`${f.question}-${index}`}
                  className="group border border-gray-200 rounded-lg px-4 py-3 bg-white"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900">
                      {f.question}
                    </h3>
                    <span className="ml-3 text-gray-400 group-open:rotate-180 transition-transform">
                      ˅
                    </span>
                  </summary>
                  <div className="mt-2 text-sm text-gray-700 leading-relaxed">{f.answer}</div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

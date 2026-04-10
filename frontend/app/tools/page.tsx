// 'use client';

// import Link from 'next/link';
// import { useSearchParams, useRouter } from 'next/navigation';
// import { useEffect, useState, Suspense } from 'react';
// import { fetchTools, fetchCategories } from '../lib/api';
// import Header from '../components/Header';
// import { stripHtml } from '../lib/richText';
// import SaveToolButton from '../components/SaveToolButton';

// type Tool = {
//   id: number;
//   name: string;
//   slug: string;
//   description: string;
//   logo?: string | null;
//   visit_url: string;
//   pricing: string;
//   rating: number;
//   category: { name: string; slug: string };
// };

// function toShortDescription(value?: string, max = 120): string {
//   if (!value) return 'No description available.';
//   const plain = stripHtml(value);
//   if (plain.length <= max) return plain;
//   return `${plain.slice(0, max).trimEnd()}...`;
// }

// function ToolsPage() {
//   const [tools, setTools] = useState<Tool[]>([]);
//   const [categoriesData, setCategoriesData] = useState<any[]>([]);
//   const [error, setError] = useState('');

//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const category = searchParams?.get('category') ?? '';
//   const pricing = searchParams?.get('pricing') ?? '';
//   const rating = searchParams?.get('rating') ?? '';
//   const sort = searchParams?.get('sort') ?? '';
//   const search = searchParams?.get('search') ?? '';

//   const updateFilters = (key: string, value: string) => {
//     const params = new URLSearchParams(searchParams?.toString() ?? '');
//     if (value) {
//       params.set(key, value);
//     } else {
//       params.delete(key);
//     }
//     router.push(`/tools?${params.toString()}`);
//   };

//   useEffect(() => {
//     const params: Record<string, string> = {};

//     if (category) params.category = category;
//     if (pricing) params.pricing = pricing;
//     if (rating) params.rating = rating;
//     if (sort) params.sort = sort;
//     if (search) params.search = search;

//     fetchTools(params)
//       .then((toolsData) => setTools(toolsData.data ?? toolsData))
//       .catch(() => setError('Failed to load tools.'));

//     fetchCategories()
//       .then((data) => setCategoriesData(data))
//       .catch(() => setError('Failed to load categories.'));
//   }, [category, pricing, rating, sort, search]);

//   if (error) {
//     return <p className="text-center text-red-500">{error}</p>;
//   }

//   return (
//     <>
//       <Header />
//       <div className="min-h-[80vh] bg-slate-50 py-10">
//         <div className="container">
//           <h1 className="mb-6 text-3xl font-bold text-slate-900">Tool Directory</h1>

//           <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
//             <aside className="card">
//               <h2 className="mb-4 font-semibold text-slate-800">Filter</h2>

//               <div className="space-y-3">
//                 <div>
//                   <label className="text-sm font-medium text-slate-600">Category</label>
//                   <select
//                     value={category}
//                     onChange={(e) => updateFilters('category', e.target.value)}
//                     className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
//                   >
//                     <option value="">All</option>
//                     {categoriesData.map((cat: any) => (
//                       <option value={cat.slug} key={cat.id}>{cat.name}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-slate-600">Pricing</label>
//                   <select
//                     value={pricing}
//                     onChange={(e) => updateFilters('pricing', e.target.value)}
//                     className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
//                   >
//                   <option value="">All</option>
//                   <option value="free">Free</option>
//                   <option value="paid">Paid</option>
//                   <option value="freemium">Freemium</option>
//                   <option value="free_trial">Free trial</option>
//                 </select>
//               </div>
//                 <div>
//                   <label className="text-sm font-medium text-slate-600">Rating</label>
//                   <select
//                     value={rating}
//                     onChange={(e) => updateFilters('rating', e.target.value)}
//                     className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
//                   >
//                     <option value="">All</option>
//                     <option value="4">4+</option>
//                     <option value="4.5">4.5+</option>
//                     <option value="5">5.0</option>
//                   </select>
//                 </div>
//               </div>
//             </aside>

//             <section>
//               <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//                 <div className="flex items-center gap-2">
//                   <label className="text-sm font-medium text-slate-500">Sort:</label>
//                   <select
//                     value={sort}
//                     onChange={(e) => updateFilters('sort', e.target.value)}
//                     className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
//                   >
//                     <option value="trending">Trending</option>
//                     <option value="new">New</option>
//                     <option value="top-rated">Top rated</option>
//                   </select>
//                   {(category || pricing || rating || search) && (
//                     <button
//                       onClick={() => router.push('/tools')}
//                       className="text-sm text-indigo-600 hover:underline"
//                     >
//                       Clear filters
//                     </button>
//                   )}
//                 </div>
//                 {search && (
//                   <div className="text-sm text-slate-600">
//                     Showing results for: <span className="font-medium">"{search}"</span>
//                   </div>
//                 )}
//               </div>

//               <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
//                 {tools.map((tool) => (
//                   <article key={tool.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
//                     <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
//                       {tool.logo ? (
//                         <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
//                       ) : (
//                         <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-500">
//                           No image
//                         </div>
//                       )}
//                     </div>
//                     <div className="p-4">
//                       <div className="flex items-start justify-between gap-3">
//                         <Link href={`/tools/${tool.slug}`} className="min-w-0 flex-1 text-sm font-semibold text-indigo-600">
//                           <h3 className="line-clamp-2 break-words text-2xl font-bold leading-tight text-slate-900">{tool.name}</h3>
//                         </Link>
//                         <a href={tool.visit_url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800" aria-label={`Visit ${tool.name}`}>
//                           <i className="bi bi-box-arrow-up-right ms-1 small" aria-hidden="true" />
//                         </a>
//                       </div>
//                       <p className="mt-3 line-clamp-3 min-h-[72px] break-words text-base leading-6 text-slate-700">{toShortDescription(tool.description)}</p>
//                       <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
//                         <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">{tool.category?.name || 'Uncategorized'}</span>
//                         <div className="text-right">
//                           <p className="text-sm font-semibold text-indigo-700">{tool.pricing}</p>
//                         </div>
//                       </div>
//                       <div className="mt-3 flex justify-end">
//                         <SaveToolButton toolId={tool.id} />
//                       </div>
//                     </div>
//                   </article>
//                 ))}
//               </div>

//               {tools.length === 0 && (
//                 <div className="mt-12 text-center">
//                   <p className="mb-2 text-slate-500">
//                     {search ? `No tools found for "${search}"` : 'No tools found'}
//                   </p>
//                   {search && (
//                     <Link href="/tools" className="text-indigo-600 hover:underline">
//                       Clear search and show all tools
//                     </Link>
//                   )}
//                 </div>
//               )}
//             </section>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// function ToolsPageWrapper() {
//   return (
//     <Suspense fallback={<div className="min-h-[80vh] bg-slate-50 py-10"><div className="container"><p className="text-center">Loading...</p></div></div>}>
//       <ToolsPage />
//     </Suspense>
'use client';

import dynamic from 'next/dynamic';

const ToolsPageComponent = dynamic(() => import('./ToolsPageClient'), {
  loading: () => null,
});

export default function ToolsPage() {
  return <ToolsPageComponent />;
}
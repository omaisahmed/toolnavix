'use client';

import { useEffect, useState } from 'react';
import { fetchTools } from '../lib/api';
import Header from '../components/Header';

export default function ComparePage() {
  const [tools, setTools] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTools()
      .then((toolsData) => setTools(toolsData.data ?? toolsData))
      .catch(() => setError('Failed to fetch tools'));
  }, []);

  const selected = tools.slice(0, 3);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
      <div className="container">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Compare tools</h1>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
          <table className="min-w-full table-auto text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2">Feature</th>
                {selected.map((tool) => (
                  <th key={tool.id} className="px-3 py-2 font-semibold text-slate-700">{tool.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Pricing', 'Rating', 'Best use case'].map((feature) => (
                <tr key={feature} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium text-slate-600">{feature}</td>
                  {selected.map((tool) => (
                    <td key={`${feature}-${tool.id}`} className="px-3 py-2 text-slate-700">
                      {feature === 'Pricing' && tool.pricing}
                      {feature === 'Rating' && `${tool.rating} ★`}
                      {feature === 'Best use case' && tool.category?.name}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
    </>
  );
}

'use client';

import { clx } from "@medusajs/ui";
import { Tag, InformationCircle } from "@medusajs/icons";

const SizeRow = ({ label, value, desc }: { label: string, value: string, desc?: string }) => (
  <div className="flex justify-between items-center py-2 border-b last:border-0 border-ui-border-base border-dashed">
    <div className="flex flex-col">
        <span className="text-sm font-bold text-ui-fg-base">{label}</span>
        {desc && <span className="text-xs text-ui-fg-subtle">{desc}</span>}
    </div>
    <span className="text-sm font-medium text-ui-fg-base bg-ui-bg-subtle px-2 py-1 rounded">
        {value}
    </span>
  </div>
);

export default function KandiSizingGuide() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT: BRACELETS */}
        <div className="bg-pink-50/50 dark:bg-pink-900/10 p-5 rounded-2xl border border-pink-100 dark:border-pink-900/20">
            <div className="flex items-center gap-2 mb-4 text-pink-600 dark:text-pink-400">
                <Tag />
                <h3 className="font-bold uppercase tracking-wider text-sm">Bracelets & Cuffs</h3>
            </div>
            <div className="flex flex-col">
                <SizeRow label="Small" value='~ 5"' desc="Child / Small Wrist" />
                <SizeRow label="Medium" value='~ 6"' desc="Standard Fit" />
                <SizeRow label="Large" value='~ 7"' desc="Loose / Larger Wrist" />
            </div>
        </div>

        {/* RIGHT: NECKLACES */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/20">
             <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <Tag />
                <h3 className="font-bold uppercase tracking-wider text-sm">Necklaces</h3>
            </div>
            <div className="flex flex-col">
                <SizeRow label="Small" value='~ 16"' desc="Choker Style" />
                <SizeRow label="Medium" value='~ 18"' desc="Standard Length" />
                <SizeRow label="Large" value='~ 20"' desc="Long / Layered" />
            </div>
        </div>

      </div>

      {/* FOOTER: HOW TO MEASURE */}
      <div className="mt-6 flex gap-3 p-4 bg-ui-bg-subtle rounded-xl text-ui-fg-subtle text-xs leading-relaxed">
         <InformationCircle className="shrink-0" />
         <p>
            <strong>How to measure:</strong> Wrap a piece of string or paper around your wrist or neck where you want the Kandi to sit. 
            Mark the overlap point, then measure the string against a ruler. If you are between sizes, we recommend sizing up!
         </p>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import DimensionDetailsTable from '../../components/DimensionDetailsTable';

interface FrameProductionPaperProps {
    paper: any;
    measurementItems: any[];
    frameDesign?: any;
}

export default function FrameProductionPaper({ paper, measurementItems, frameDesign }: FrameProductionPaperProps) {
    // Local state for editable fields
    const [headerData, setHeaderData] = useState({
        siteName: paper.site_name || '',
        siteLocation: paper.site_location || '',
        poDate: paper.po_date || new Date().toISOString().split('T')[0],
        marketingName: paper.marketing_name || '',
        concept: paper.concept || '',
        thickness: paper.thickness || '',
        createDate: new Date(paper.created_at).toLocaleDateString() || new Date().toLocaleDateString(),
        productionCode: paper.production_code || paper.paper_number || '',
        generalArea: paper.area || '',
        dod: paper.dod || '',
        totalQuantity: paper.total_quantity || ''
    });

    // Local state for technical details
    const [technicalDetails, setTechnicalDetails] = useState({
        construction: paper.construction || '',
        frameDesign: paper.frame_design || paper.design || '',
        wallType: paper.wall_type || '',
        laminate: paper.laminate || '',
        rebate: paper.rebate || '',
        subFrame: paper.sub_frame || '',
        coverMoulding: paper.cover_moulding || '',
        remark: paper.remark || paper.remarks || ''
    });

    // Local state for measurement items
    const [items, setItems] = useState<any[]>([]);

    const convertToMM = (val: any) => {
        if (!val || val === '-') return '';
        const num = typeof val === 'string' ? parseFloat(val.replace('"', '')) : val;
        if (isNaN(num)) return val.toString();
        // If value is < 100, it's likely inches. Convert to MM.
        if (num < 100) return Math.round(num * 25.4);
        return Math.round(num);
    };

    useEffect(() => {
        if (measurementItems && measurementItems.length > 0) {
            // Group items by dimensions in MM
            const groups: { [key: string]: any } = {};

            measurementItems.forEach(item => {
                const rawWidth = item.act_width || item.width || item.w || item.ro_width || '';
                const rawHeight = item.act_height || item.height || item.h || item.ro_height || '';
                const wallRaw = item.wall || '';

                const widthMM = convertToMM(rawWidth);
                const heightMM = convertToMM(rawHeight);
                const wallMM = convertToMM(wallRaw);

                const key = `${widthMM}-${heightMM}-${wallMM}`;
                const loc = item.bldg || item.bldg_wing || '';
                const qty = parseInt(item.qty || item.quantity) || 1;

                if (groups[key]) {
                    groups[key].qty += qty;
                    if (loc && !groups[key].location.includes(loc)) groups[key].location.push(loc);
                } else {
                    groups[key] = {
                        ...item,
                        width: widthMM,
                        height: heightMM,
                        wall: wallMM,
                        location: loc ? [loc] : [],
                        qty
                    };
                }
            });

            const sortedGrouped = Object.values(groups).sort((a: any, b: any) => {
                const wDiff = (parseFloat(a.width) || 0) - (parseFloat(b.width) || 0);
                if (wDiff !== 0) return wDiff;
                const hDiff = (parseFloat(a.height) || 0) - (parseFloat(b.height) || 0);
                if (hDiff !== 0) return hDiff;
                return (parseFloat(a.wall) || 0) - (parseFloat(b.wall) || 0);
            });

            setItems(sortedGrouped.map((item, idx) => ({
                ...item,
                srNo: idx + 1,
                location: Array.isArray(item.location) ? item.location.join(', ') : (item.location || '-')
            })));
        }
    }, [measurementItems]);

    const totalQty = items.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);

    const getImageSrc = (imageStr: string | null | undefined) => {
        if (!imageStr) return undefined;
        if (imageStr.startsWith('data:')) return imageStr;
        return `data:image/png;base64,${imageStr}`;
    };

    return (
        <div className="bg-white min-h-screen p-4 md:p-8">
            {/* Control Panel */}
            <div className="flex justify-end gap-3 mb-6 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
                >
                    <Printer className="w-4 h-4" /> Print PDF
                </button>
                </div>

            {/* Layout Container */}
            <div className="max-w-[210mm] mx-auto border-[1.5pt] border-black p-4 font-sans text-gray-900 print:p-0 print:border-none">

                {/* HEADER SECTION */}
                <div className="grid grid-cols-4 border-2 border-black mb-4">
                    <div className="border-r border-b border-black p-2 bg-gray-50">
                        <span className="text-[10px] font-bold uppercase block text-gray-500">Site Name</span>
                        <input
                            type="text"
                            value={headerData.siteName}
                            onChange={e => setHeaderData({ ...headerData, siteName: e.target.value })}
                            className="w-full text-sm font-bold bg-transparent outline-none uppercase"
                        />
                    </div>
                    <div className="border-r border-b border-black p-2 bg-gray-50">
                        <span className="text-[10px] font-bold uppercase block text-gray-500">Location</span>
                        <input
                            type="text"
                            value={headerData.siteLocation}
                            onChange={e => setHeaderData({ ...headerData, siteLocation: e.target.value })}
                            className="w-full text-sm font-bold bg-transparent outline-none uppercase"
                        />
                    </div>
                    <div className="border-r border-b border-black p-2 bg-gray-50">
                        <span className="text-[10px] font-bold uppercase block text-gray-500">PO Date</span>
                        <input
                            type="date"
                            value={headerData.poDate}
                            onChange={e => setHeaderData({ ...headerData, poDate: e.target.value })}
                            className="w-full text-sm font-bold bg-transparent outline-none"
                        />
                    </div>
                    <div className="border-b border-black p-2 bg-gray-50">
                        <span className="text-[10px] font-bold uppercase block text-gray-500">Marketing Person</span>
                        <input
                            type="text"
                            value={headerData.marketingName}
                            onChange={e => setHeaderData({ ...headerData, marketingName: e.target.value })}
                            className="w-full text-sm font-bold bg-transparent outline-none uppercase"
                        />
                    </div>

                    <div className="col-span-2 border-r border-b border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">Product Area</span>
                            <input
                                type="text"
                                value={headerData.generalArea}
                                onChange={e => setHeaderData({ ...headerData, generalArea: e.target.value })}
                                className="flex-1 text-sm font-bold outline-none uppercase"
                            />
                        </div>
                    </div>
                    <div className="col-span-2 border-b border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">Total Quantity</span>
                            <input
                                type="text"
                                value={headerData.totalQuantity}
                                onChange={e => setHeaderData({ ...headerData, totalQuantity: e.target.value })}
                                className="flex-1 text-sm font-bold outline-none uppercase"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 border-r border-b border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">Concept</span>
                            <input
                                type="text"
                                value={headerData.concept}
                                onChange={e => setHeaderData({ ...headerData, concept: e.target.value })}
                                className="flex-1 text-sm font-bold outline-none uppercase"
                            />
                        </div>
                    </div>
                    <div className="col-span-2 border-b border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">Create Date</span>
                            <span className="text-sm font-bold uppercase">{headerData.createDate}</span>
                        </div>
                    </div>

                    <div className="col-span-2 border-r border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">(PW) Production Code</span>
                            <input
                                type="text"
                                value={headerData.productionCode}
                                onChange={e => setHeaderData({ ...headerData, productionCode: e.target.value })}
                                className="flex-1 text-sm font-bold outline-none uppercase"
                            />
                        </div>
                    </div>
                    <div className="col-span-2 border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">DOD</span>
                            <input
                                type="text"
                                value={headerData.dod}
                                onChange={e => setHeaderData({ ...headerData, dod: e.target.value })}
                                className="flex-1 text-sm font-bold outline-none uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* MAIN BODY */}
                <div className="flex gap-4 mb-4">
                    {/* LEFT: TECHNICAL DETAILS */}
                    <div className="flex-1">
                        <table className="w-full border-collapse border border-black text-xs">
                            <tbody>
                                {[
                                    ['CONSTRUCTION', 'construction'],
                                    ['FRAME DESIGN', 'frameDesign'],
                                    ['WALL TYPE', 'wallType'],
                                    ['LAMINATE', 'laminate'],
                                    ['REBATE', 'rebate'],
                                    ['SUB FRAME', 'subFrame'],
                                    ['COVER MOULDING', 'coverMoulding'],
                                    ['REMARK', 'remark']
                                ].map(([label, key]) => (
                                    <tr key={key} className="border-b border-black last:border-b-0">
                                        <td className="p-1.5 font-bold bg-gray-50 border-r border-black w-1/3 uppercase tracking-tight">{label}</td>
                                        <td className="p-0">
                                            <input
                                                type="text"
                                                value={technicalDetails[key as keyof typeof technicalDetails]}
                                                onChange={e => setTechnicalDetails({ ...technicalDetails, [key]: e.target.value })}
                                                className="w-full p-1.5 font-medium outline-none uppercase bg-transparent"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT: DESIGN IMAGE */}
                    <div className="w-[300px] flex flex-col">
                        <div className="flex-1 border-2 border-blue-600 bg-blue-50 relative flex items-center justify-center p-2 min-h-[300px]">
                            <span className="absolute top-2 left-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-50/80 px-1">Frame Design Image</span>
                            {frameDesign?.image ? (
                                <img
                                    src={getImageSrc(frameDesign.image)}
                                    alt="Design"
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <div className="text-blue-300 font-black text-2xl rotate-45 opacity-20 select-none">DESIGN PREVIEW</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Frame Dimension Details */}
                <DimensionDetailsTable type="frame" items={items} variant="main" />

                {/* FOOTER */}
                <div className="mt-8 flex justify-between items-end border-t border-gray-100 pt-4 opacity-50">
                    <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Frame Production Paper | Innovadoor Products Pvt Ltd</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Ver 1.0 | ERP System</div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
          .print-content { width: 100%; border: none; shadow: none; }
          input { border: none !important; }
          .bg-gray-50, .bg-gray-100, .bg-gray-200 { background-color: #f3f4f6 !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .border-blue-600 { border-color: #2563eb !important; }
        }
      `}} />
        </div>
    );
}

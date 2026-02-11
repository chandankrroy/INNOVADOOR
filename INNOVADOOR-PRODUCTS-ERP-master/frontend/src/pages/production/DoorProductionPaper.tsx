import { useState, useEffect, useMemo } from 'react';
import DimensionDetailsTable from '../../components/DimensionDetailsTable';

interface DoorProductionPaperProps {
    paper: any;
    measurementItems: any[];
    frontsideDesign: any;
}

export default function DoorProductionPaper({ paper, measurementItems, frontsideDesign }: DoorProductionPaperProps) {
    // Local state for editable fields that might not be in the database yet
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
        dod: paper.dod || ''
    });

    // Local state for technical details
    const [technicalDetails, setTechnicalDetails] = useState({
        thickness: paper.thickness || '',
        sideFrame: paper.side_frame || '',
        filler: paper.filler || '',
        core: paper.core || '',
        grade: paper.grade || '',
        frontsideLaminate: paper.frontside_laminate || paper.laminate || '',
        backsideLaminate: paper.backside_laminate || '',
        frontsideDesign: paper.frontside_design || paper.design || '',
        backsideDesign: paper.backside_design || '',
        gelColour: paper.gel_colour || '',
        foamBottom: paper.foam_bottom || '',
        frpCoating: paper.frp_coating || ''
    });

    // Local state for measurement items to allow editing/display
    const [items, setItems] = useState<any[]>([]);

    const convertToInches = (val: any) => {
        if (!val || val === '-') return '';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return val.toString();
        // If value is > 100, it's likely MM. Else it's likely already inches.
        if (num > 100) return (num / 25.4).toFixed(2) + '"';
        return num.toFixed(2) + '"';
    };

    useEffect(() => {
        if (measurementItems && measurementItems.length > 0) {
            const getNum = (val: any) => {
                if (val == null || val === '' || val === '-') return null;
                const num = typeof val === 'string' ? parseFloat(String(val).replace('"', '')) : val;
                return isNaN(num) ? null : num;
            };
            const groups: { [key: string]: { ro_width: any; ro_height: any; location: string[]; qty: number; actSqFt: number } } = {};
            measurementItems.forEach(item => {
                const rw = item.ro_width ?? item.width ?? item.w;
                const rh = item.ro_height ?? item.height ?? item.h;
                const key = `${rw}-${rh}`;
                const loc = item.bldg || item.bldg_wing || '';
                const qty = Number(item.qty) || Number(item.quantity) || 1;
                let itemSqFt = 0;
                if (item.act_sq_ft != null && !isNaN(Number(item.act_sq_ft))) itemSqFt = Number(item.act_sq_ft) * qty;
                else {
                    const w = item.act_width ?? item.width ?? item.w;
                    const h = item.act_height ?? item.height ?? item.h;
                    const wi = typeof w === 'string' ? parseFloat(String(w).replace('"', '')) : w;
                    const hi = typeof h === 'string' ? parseFloat(String(h).replace('"', '')) : h;
                    if (!isNaN(wi) && !isNaN(hi)) {
                        const wiInch = (wi > 100 ? wi / 25.4 : wi) || 0;
                        const hiInch = (hi > 100 ? hi / 25.4 : hi) || 0;
                        itemSqFt = (wiInch * hiInch / 144) * qty;
                    }
                }
                if (groups[key]) {
                    groups[key].qty += qty;
                    groups[key].actSqFt += itemSqFt;
                    if (loc && !groups[key].location.includes(loc)) groups[key].location.push(loc);
                } else {
                    groups[key] = { ro_width: rw, ro_height: rh, location: loc ? [loc] : [], qty, actSqFt: itemSqFt };
                }
            });
            const sorted = Object.values(groups).sort((a, b) => {
                const aw = getNum(a.ro_width) ?? 0;
                const bw = getNum(b.ro_width) ?? 0;
                if (aw !== bw) return aw - bw;
                const ah = getNum(a.ro_height) ?? 0;
                const bh = getNum(b.ro_height) ?? 0;
                return ah - bh;
            });
            setItems(sorted.map((row, idx) => ({
                srNo: idx + 1,
                ro_width: row.ro_width,
                ro_height: row.ro_height,
                location: row.location.length ? row.location.join(', ') : '-',
                qty: row.qty,
                actSqFt: row.actSqFt
            })));
        } else {
            setItems([]);
        }
    }, [measurementItems]);

    const section4Items = useMemo(() => {
        if (!measurementItems?.length) return [];
        const toNum = (val: any) => {
            if (val == null || val === '' || val === '-') return null;
            const num = typeof val === 'string' ? parseFloat(String(val).replace('"', '')) : val;
            return isNaN(num) ? null : num;
        };
        const toMm = (val: any) => {
            const n = toNum(val);
            if (n == null) return null;
            return n < 100 ? Math.round(n * 25.4) : Math.round(n);
        };
        const toInch = (val: any) => {
            const n = toNum(val);
            if (n == null) return null;
            return n > 100 ? Number((n / 25.4).toFixed(2)) : Number(n.toFixed(2));
        };
        return measurementItems.map((item: any, idx: number) => {
            const bldg = item.bldg ?? item.bldg_wing ?? '';
            const flatNo = item.flat_no ?? item.flat ?? '';
            const areaVal = item.area ?? '';
            const location = [bldg, flatNo, areaVal].filter(Boolean).join('_') || '-';
            const widthRaw = item.width ?? item.w ?? item.ro_width;
            const heightRaw = item.height ?? item.h ?? item.ro_height;
            const actW = item.act_width ?? item.width ?? item.w;
            const actH = item.act_height ?? item.height ?? item.h;
            const widthMm = toMm(widthRaw);
            const heightMm = toMm(heightRaw);
            const actWidthMm = toMm(actW);
            const actHeightMm = toMm(actH);
            const actWidthInch = toInch(actW);
            const actHeightInch = toInch(actH);
            const roWidthInch = toInch(item.ro_width ?? widthRaw);
            const roHeightInch = toInch(item.ro_height ?? heightRaw);
            let actSqFt = 0;
            if (item.act_sq_ft != null && !isNaN(Number(item.act_sq_ft))) actSqFt = Number(item.act_sq_ft);
            else if (actWidthMm != null && actHeightMm != null) actSqFt = (actWidthMm / 25.4) * (actHeightMm / 25.4) / 144;
            const qty = Number(item.qty) ?? Number(item.quantity) ?? 1;
            return {
                srNo: idx + 1,
                user_serial: item.item_no ?? item.serial ?? item.user_serial ?? '',
                location,
                bldg_wings: bldg || '-',
                flat_no: flatNo || '-',
                area: areaVal || '-',
                width_mm: widthMm ?? '-',
                height_mm: heightMm ?? '-',
                act_width_mm: actWidthMm ?? '-',
                act_height_mm: actHeightMm ?? '-',
                act_width_inch: actWidthInch ?? '-',
                act_height_inch: actHeightInch ?? '-',
                ro_width_inches: roWidthInch ?? '-',
                ro_height_inches: roHeightInch ?? '-',
                act_sq_ft: actSqFt,
                remark: item.remark ?? '',
                qty
            };
        });
    }, [measurementItems]);

    const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const totalSqFt = items.reduce((sum, item) => sum + (Number(item.actSqFt) || 0), 0);

    const getImageSrc = (imageStr: string | null | undefined) => {
        if (!imageStr) return undefined;
        if (imageStr.startsWith('data:')) return imageStr;
        return `data:image/png;base64,${imageStr}`;
    };

    return (
        <div className="bg-white min-h-screen p-4 md:p-8">
            {/* Production Paper Layout Container */}
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
                        <span className="text-[10px] font-bold uppercase block text-gray-500">Site Location</span>
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
                        <span className="text-[10px] font-bold uppercase block text-gray-500">Marketing Person Name</span>
                        <input
                            type="text"
                            value={headerData.marketingName}
                            onChange={e => setHeaderData({ ...headerData, marketingName: e.target.value })}
                            className="w-full text-sm font-bold bg-transparent outline-none uppercase"
                        />
                    </div>

                    <div className="col-span-2 border-r border-b border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">(Core) Concept (Thickness)</span>
                            <input
                                type="text"
                                value={`${headerData.concept} (${headerData.thickness})`}
                                onChange={e => {
                                    const val = e.target.value;
                                    const concept = val.split('(')[0].trim();
                                    setHeaderData({ ...headerData, concept });
                                }}
                                className="flex-1 text-sm font-bold outline-none uppercase"
                            />
                        </div>
                    </div>
                    <div className="col-span-2 border-b border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">Production Paper Create Date</span>
                            <span className="text-sm font-bold uppercase">{headerData.createDate}</span>
                        </div>
                    </div>

                    <div className="col-span-2 border-r border-black p-2">
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold uppercase text-gray-500">(PW) Production Code (General-Area)</span>
                            <input
                                type="text"
                                value={`${headerData.productionCode} (${headerData.generalArea})`}
                                onChange={e => {
                                    const val = e.target.value;
                                    const productionCode = val.split('(')[0].trim();
                                    setHeaderData({ ...headerData, productionCode });
                                }}
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

                {/* MAIN BODY - SPLIT SECTION */}
                <div className="flex gap-4 mb-4">
                    {/* LEFT: TECHNICAL DETAILS */}
                    <div className="flex-1">
                        <table className="w-full border-collapse border border-black text-xs">
                            <tbody>
                                {[
                                    ['THICKNESS', 'thickness'],
                                    ['SIDE FRAME', 'sideFrame'],
                                    ['FILLER', 'filler'],
                                    ['CORE', 'core'],
                                    ['GRADE', 'grade'],
                                    ['FRONTSIDE LAMINATE', 'frontsideLaminate'],
                                    ['BACKSIDE LAMINATE', 'backsideLaminate'],
                                    ['FRONTSIDE DESIGN', 'frontsideDesign'],
                                    ['BACKSIDE DESIGN', 'backsideDesign'],
                                    ['GEL COLOUR', 'gelColour'],
                                    ['FOAM BOTTOM', 'foamBottom'],
                                    ['FRP COATING ON BOTTOM', 'frpCoating']
                                ].map(([label, key]) => (
                                    <tr key={key} className="border-b border-black last:border-b-0">
                                        <td className="p-1.5 font-bold bg-gray-50 border-r border-black w-1/2 uppercase tracking-tight">{label}</td>
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
                        <div className="flex-1 border-2 border-blue-600 bg-blue-50 relative flex items-center justify-center p-2 min-h-[400px]">
                            <span className="absolute top-2 left-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-50/80 px-1">Shutter Design Image</span>
                            {frontsideDesign?.image ? (
                                <img
                                    src={getImageSrc(frontsideDesign.image)}
                                    alt="Design"
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <div className="text-blue-300 font-black text-2xl rotate-45 opacity-20 select-none">DESIGN PREVIEW</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Shutter Dimension Details */}
                <DimensionDetailsTable type="shutter" items={items} variant="main" />

                {/* FACTORY STYLE MARKER */}
                <div className="mt-8 flex justify-between items-end border-t border-gray-100 pt-4 opacity-50">
                    <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Shutter Production Paper | Innovadoor Products Pvt Ltd</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Ver 1.0 | ERP System</div>
                </div>

            </div>

            {/* SECTION 4: MEASUREMENT TRACEABILITY - Shutter Dimension Details (full columns) */}
            {section4Items.length > 0 && (
                <div className="page-break pt-8 print:pt-0">
                    <div className="bg-gray-100 px-6 py-4 border-2 border-black mb-6 flex justify-between items-center print:bg-gray-100">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">
                            SECTION 4: MEASUREMENT TRACEABILITY ({paper.paper_number})
                        </h3>
                        <span className="text-xs font-bold text-gray-500 uppercase">Supervisor / QC COPY</span>
                    </div>

                    <DimensionDetailsTable type="shutter" items={section4Items} variant="section4" />
                </div>
            )}

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
          .col-span-2 { grid-column: span 2 / span 2; }
          .col-span-4 { grid-column: span 4 / span 4; }
          .section4-measurement-traceability-table { width: 100% !important; overflow: visible !important; }
          .section4-measurement-traceability-table table { width: 100% !important; table-layout: fixed !important; font-size: 8px !important; }
          .section4-measurement-traceability-table th,
          .section4-measurement-traceability-table td { padding: 2px 4px !important; font-size: 8px !important; }
        }
      `}} />
        </div>
    );
}

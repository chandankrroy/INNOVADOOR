interface DimensionDetailsTableProps {
  type: 'frame' | 'shutter';
  items: any[];
  showTitle?: boolean;
  variant?: 'main' | 'section4';
}

export default function DimensionDetailsTable({ type, items, showTitle = true, variant = 'main' }: DimensionDetailsTableProps) {
  const title = type === 'frame' ? 'Frame Dimension Details' : 'Shutter Dimension Details';

  const borderClass = 'border-black';
  const headerBgClass = variant === 'section4' ? 'bg-gray-100' : 'bg-gray-200';
  const footerBgClass = 'bg-gray-100';

  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalSqFt = type === 'shutter'
    ? items.reduce((sum, item) => sum + (Number(item.actSqFt) || 0), 0)
    : 0;

  const thClass = `border-r ${borderClass} px-2 py-1 text-center font-bold text-xs text-gray-900 whitespace-nowrap`;
  const tdClass = `border-r ${borderClass} px-2 py-1 text-center text-xs text-gray-900`;

  if (variant === 'main') {
    const mainThClass = `border-r ${borderClass} p-1 text-[10px] font-black uppercase whitespace-nowrap`;
    const mainTdClass = `border-r ${borderClass} p-1.5 text-center text-xs`;

    return (
      <div className="border-t-2 border-black pt-4 overflow-x-auto">
        {showTitle && (
          <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3">{title}</h4>
        )}
        <table className="w-full border-collapse border-b-2 border-black">
          <thead>
            <tr className={`${headerBgClass} border-2 ${borderClass}`}>
              {type === 'frame' ? (
                <>
                  <th className={`${mainThClass}`}>SR NO</th>
                  <th className={`${mainThClass}`}>WIDTH</th>
                  <th className={`${mainThClass}`}>HEIGHT</th>
                  <th className={`${mainThClass}`}>WALL</th>
                  <th className={`${mainThClass}`}>WING/BLDG</th>
                  <th className={`p-1 text-[10px] font-black uppercase whitespace-nowrap`}>QUANTITY</th>
                </>
              ) : (
                <>
                  <th className={`${mainThClass}`}>SR NO</th>
                  <th className={`${mainThClass}`}>RO_WIDTH</th>
                  <th className={`${mainThClass}`}>RO_HEIGHT</th>
                  <th className={`${mainThClass}`}>WING/BLDG</th>
                  <th className={`${mainThClass}`}>QUANTITY</th>
                  <th className={`p-1 text-[10px] font-black uppercase whitespace-nowrap`}>ACT SqF</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={idx} className={`border-x border-b ${borderClass}`}>
                  <td className={`${mainTdClass} font-bold`}>{item.srNo}</td>
                  {type === 'frame' ? (
                    <>
                      <td className={mainTdClass}>{item.width ?? '-'}</td>
                      <td className={mainTdClass}>{item.height ?? '-'}</td>
                      <td className={mainTdClass}>{item.wall ?? '-'}</td>
                      <td className={`${mainTdClass} break-words`}>{item.location ?? '-'}</td>
                      <td className="p-1.5 text-center text-xs">{item.qty}</td>
                    </>
                  ) : (
                    <>
                      <td className={mainTdClass}>{item.ro_width ?? '-'}</td>
                      <td className={mainTdClass}>{item.ro_height ?? '-'}</td>
                      <td className={`${mainTdClass} break-words`}>{item.location ?? '-'}</td>
                      <td className={mainTdClass}>{item.qty}</td>
                      <td className="p-1.5 text-center text-xs">{item.actSqFt > 0 ? item.actSqFt.toFixed(3) : '-'}</td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 italic text-sm">No items available</td>
              </tr>
            )}
          </tbody>
          <tfoot className={`border-2 ${borderClass} ${footerBgClass} font-black`}>
            <tr>
              {type === 'frame' ? (
                <>
                  <td colSpan={5} className={`p-1.5 text-right text-[10px] border-r ${borderClass} uppercase`}>TOTAL</td>
                  <td className="p-1.5 text-center text-sm">{totalQty} <span className="text-[10px]">NOS</span></td>
                </>
              ) : (
                <>
                  <td colSpan={4} className={`p-1.5 text-right text-[10px] border-r ${borderClass} uppercase`}>TOTAL</td>
                  <td className={`p-1.5 text-center text-sm border-r ${borderClass}`}>{totalQty} <span className="text-[10px]">NOS</span></td>
                  <td className="p-1.5 text-center text-sm">{totalSqFt > 0 ? totalSqFt.toFixed(3) : '-'}</td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // section4 variant - Shutter: horizontal table (same layout on screen and print)
  if (type === 'shutter' && variant === 'section4') {
    const shutterSection4Cols = [
      'Sr No',
      'User Serial',
      'Location',
      'BLDG/Wings',
      'Flat No',
      'Area',
      'Width (mm)',
      'Height (mm)',
      'Act Width (mm)',
      'Act Height (mm)',
      'Act Width (inch)',
      'Act Height (inch)',
      'RO Width (inches)',
      'RO Height (inches)',
      'Act Sq. Ft.',
      'Remark'
    ];
    const totalSqFtS4 = items.reduce((sum, item) => sum + (Number(item.act_sq_ft) || 0), 0);
    return (
      <div className="w-full overflow-x-auto section4-measurement-traceability-table">
        {showTitle && (
          <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3">{title}</h4>
        )}
        <table className="w-full border-collapse border-b-2 border-black" style={{ fontSize: '10px' }}>
          <thead>
            <tr className={`border-b-2 ${borderClass} ${headerBgClass}`}>
              {shutterSection4Cols.map((col) => (
                <th key={col} className={thClass}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={`border-b ${borderClass}`}>
                <td className={tdClass}>{item.srNo ?? idx + 1}</td>
                <td className={tdClass}>{item.user_serial ?? '-'}</td>
                <td className={`${tdClass} break-words`}>{item.location ?? '-'}</td>
                <td className={tdClass}>{item.bldg_wings ?? '-'}</td>
                <td className={tdClass}>{item.flat_no ?? '-'}</td>
                <td className={tdClass}>{item.area ?? '-'}</td>
                <td className={tdClass}>{item.width_mm ?? '-'}</td>
                <td className={tdClass}>{item.height_mm ?? '-'}</td>
                <td className={tdClass}>{item.act_width_mm ?? '-'}</td>
                <td className={tdClass}>{item.act_height_mm ?? '-'}</td>
                <td className={tdClass}>{item.act_width_inch ?? '-'}</td>
                <td className={tdClass}>{item.act_height_inch ?? '-'}</td>
                <td className={tdClass}>{item.ro_width_inches ?? '-'}</td>
                <td className={tdClass}>{item.ro_height_inches ?? '-'}</td>
                <td className={tdClass}>{typeof item.act_sq_ft === 'number' && item.act_sq_ft > 0 ? item.act_sq_ft.toFixed(3) : (item.act_sq_ft ?? '-')}</td>
                <td className={`${tdClass} break-words`}>{item.remark ?? '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className={`border-2 ${borderClass} ${footerBgClass} font-black`}>
            <tr>
              <td colSpan={14} className={`p-1.5 text-right text-[10px] border-r ${borderClass} uppercase`}>TOTAL</td>
              <td className="p-1.5 text-center text-sm border-r border-black">{totalSqFtS4 > 0 ? totalSqFtS4.toFixed(3) : '-'}</td>
              <td className="p-1.5 text-center text-[10px]">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // section4 variant for frame (kept for any legacy use; Section 4 is not shown for Frame)
  return (
    <div className="w-full overflow-x-auto">
      {showTitle && (
        <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3">{title}</h4>
      )}
      <table className="w-full border-collapse border-b-2 border-black" style={{ fontSize: '10px' }}>
        <thead>
          <tr className={`border-b-2 ${borderClass} ${headerBgClass}`}>
            <th className={thClass}>SR NO</th>
            <th className={thClass}>WIDTH</th>
            <th className={thClass}>HEIGHT</th>
            <th className={thClass}>WALL</th>
            <th className={thClass}>WING/BLDG</th>
            <th className={`px-2 py-1 text-center font-bold text-xs text-gray-900 whitespace-nowrap`}>QUANTITY</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className={`border-b ${borderClass}`}>
              <td className={tdClass}>{item.srNo ?? idx + 1}</td>
              <td className={tdClass}>{item.width ?? '-'}</td>
              <td className={tdClass}>{item.height ?? '-'}</td>
              <td className={tdClass}>{item.wall ?? '-'}</td>
              <td className={`${tdClass} break-words`}>{item.location ?? '-'}</td>
              <td className={`px-2 py-1 text-center text-xs text-gray-900`}>{item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

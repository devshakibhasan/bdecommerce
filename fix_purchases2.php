<?php
$c = file_get_contents('src/app/admin/purchases/page.tsx');

$end_correct = '
                      <td className="px-6 py-4">
                        <div className="text-xs">{sup.contact_person || \'N/A\'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{sup.phone || sup.email || \'\'}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {sup.active_orders_count || 0}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600">
                        {formatBDT(sup.ledger_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Supplier Modal */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add New Supplier">
        <form onSubmit={(e) => { e.preventDefault(); createSupplier.mutate(supplierForm); }} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Supplier Name *</label>
            <input required type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Person</label>
            <input type="text" value={supplierForm.contact_person} onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</label>
              <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Address</label>
            <textarea value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[80px]" />
          </div>
          <button disabled={createSupplier.isPending} type="submit" className="w-full neu-btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            {createSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : \'Save Supplier\'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
';

$c = preg_replace('/<td className="px-6 py-4">\s*<div className="text-xs">\{sup\.contact_person \|\| \'N\/A\'\}\s*<div className="text-\[10px\] text-muted-foreground font-mono">\{sup\.phone \|\| sup\.email \|\| \'\'\}\s*<\/td>.*$/is', ltrim($end_correct), $c);
file_put_contents('src/app/admin/purchases/page.tsx', $c);
echo "Done";

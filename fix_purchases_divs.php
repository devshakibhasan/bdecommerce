<?php
$file = 'src/app/admin/purchases/page.tsx';
$c = file_get_contents($file);

// Fix Orders section
$c = str_replace(
'          {isOrdersLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Loading orders...
          ) : orders?.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <PackagePlus className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-black text-foreground">No Purchase Orders Yet</h3>
            
          ) : (',

'          {isOrdersLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Loading orders...</div>
          ) : orders?.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <PackagePlus className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-black text-foreground">No Purchase Orders Yet</h3>
            </div>
          ) : (',
$c);

$c = str_replace(
'              </table>
            
          )}
        
      )}',

'              </table>
            </div>
          )}
        </div>
      )}',
$c);


// Fix Suppliers section
$c = str_replace(
'          {isSuppliersLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Loading suppliers...
          ) : suppliers?.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <User className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-black text-foreground">No Suppliers</h3>
            
          ) : (',

'          {isSuppliersLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Loading suppliers...</div>
          ) : suppliers?.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <User className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-black text-foreground">No Suppliers</h3>
            </div>
          ) : (',
$c);


$c = str_replace(
'            <button onClick={() => setIsSupplierModalOpen(true)} className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Supplier
            </button>
          
          {isSuppliersLoading',

'            <button onClick={() => setIsSupplierModalOpen(true)} className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Supplier
            </button>
          </div>
          {isSuppliersLoading',
$c);

$c = str_replace(
'            <Link href="/admin/purchases/create" className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" /> New PO
            </Link>
          
          {isOrdersLoading',

'            <Link href="/admin/purchases/create" className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" /> New PO
            </Link>
          </div>
          {isOrdersLoading',
$c);


file_put_contents($file, $c);
echo "Done";

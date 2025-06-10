
"use client";

import type { Product } from '@/types';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

const StockManagerClient: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseOptionalFloat = (value: string | undefined): number | undefined => {
    if (value === undefined || value.trim() === '') return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  };

  const parseOptionalInt = (value: string | undefined): number | undefined => {
    if (value === undefined || value.trim() === '') return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          toast({ variant: 'destructive', title: 'Empty File', description: 'The selected CSV file is empty or contains no product lines.', duration: 5000 });
          return;
        }

        const headerLine = lines.shift(); // Assume first line is header and ignore for data processing for now
        // TODO: Optionally validate headerLine against expected columns: "ID,Activo (0/1),Nombre,Categorías,Precio sin IVA,Precio con IVA,Precio de coste,Marca,Cantidad,Resumen,Descripción"

        const importedProducts: Product[] = lines.map((line, index) => {
          const parts = line.split(',').map(part => part.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"')); // Basic CSV unquoting
          
          if (parts.length < 11) throw new Error(`Line ${index + 1} (after header) has insufficient data. Expected 11 columns. Found ${parts.length}: ${line}`);
          
          const code = parts[0];
          const isActiveStr = parts[1];
          const name = parts[2];
          const categories = parts[3];
          const priceWithoutVATStr = parts[4];
          const priceWithVATStr = parts[5];
          const costPriceStr = parts[6];
          const brand = parts[7];
          const quantityStr = parts[8];
          const summary = parts[9];
          const description = parts[10];

          if (!code) throw new Error(`Missing ID (code) on line ${index + 1}.`);
          if (!name) throw new Error(`Missing Nombre (name) on line ${index + 1}.`);
          
          const quantity = parseInt(quantityStr, 10);
          if (isNaN(quantity)) throw new Error(`Invalid Cantidad (quantity) '${quantityStr}' on line ${index + 1}. Must be a number.`);

          const isActive = isActiveStr === '1';
          const priceWithoutVAT = parseOptionalFloat(priceWithoutVATStr);
          const priceWithVAT = parseOptionalFloat(priceWithVATStr);
          const costPrice = parseOptionalFloat(costPriceStr);
          
          return {
            id: code, 
            code: code,
            isActive: isActive,
            name: name,
            categories: categories || undefined,
            priceWithoutVAT: priceWithoutVAT,
            priceWithVAT: priceWithVAT,
            costPrice: costPrice,
            brand: brand || undefined,
            quantity: quantity,
            summary: summary || undefined,
            description: description || undefined,
            lastUpdated: new Date().toISOString(),
          };
        });
        setProducts(importedProducts);
        setSelectedProduct(null); 
        toast({ title: 'Success', description: `${importedProducts.length} products imported successfully from CSV.` });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during CSV file parsing.';
        toast({ variant: 'destructive', title: 'Error Importing CSV File', description: errorMessage, duration: 10000 });
      }
    };
    reader.readAsText(file);
    if (event.target) { 
      event.target.value = '';
    }
  };
  
  const escapeCsvField = (field: string | number | boolean | undefined | null): string => {
    if (field === undefined || field === null) {
      return '';
    }
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'There is no stock data to export.' });
      return;
    }
    
    const header = "ID,Activo (0/1),Nombre,Categorías,Precio sin IVA,Precio con IVA,Precio de coste,Marca,Cantidad,Resumen,Descripción";
    const csvRows = products.map(p => 
      [
        escapeCsvField(p.code),
        escapeCsvField(p.isActive ? '1' : '0'),
        escapeCsvField(p.name),
        escapeCsvField(p.categories),
        escapeCsvField(p.priceWithoutVAT),
        escapeCsvField(p.priceWithVAT),
        escapeCsvField(p.costPrice),
        escapeCsvField(p.brand),
        escapeCsvField(p.quantity),
        escapeCsvField(p.summary),
        escapeCsvField(p.description),
      ].join(',')
    );
    const content = [header, ...csvRows].join('\n');
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'stock_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Success', description: 'Stock data exported successfully as CSV. Save the downloaded file.' });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({ ...product }); 
    setIsEditing(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | undefined = value;
    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
      if (name === 'quantity' && value !== '') processedValue = parseInt(value, 10);
    }

    setEditForm(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleSwitchChange = (name: keyof Product, checked: boolean) => {
    setEditForm(prev => ({ ...prev, [name]: checked }));
  };


  const handleUpdateProduct = () => {
    if (!selectedProduct || !editForm.code) { // Use code as a proxy for id presence from form
        toast({ variant: 'destructive', title: 'Error', description: 'Product selection or code is missing.' });
        return;
    }
    
    const quantity = typeof editForm.quantity === 'number' ? editForm.quantity : selectedProduct.quantity;
    if (isNaN(quantity) || quantity < 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Quantity must be a non-negative number.' });
        return;
    }
    if (!editForm.name) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name cannot be empty.' });
        return;
    }

    const updatedProduct: Product = {
      id: editForm.code, // Assuming code is the ID
      code: editForm.code,
      name: editForm.name,
      isActive: editForm.isActive ?? selectedProduct.isActive,
      categories: editForm.categories || undefined,
      priceWithoutVAT: typeof editForm.priceWithoutVAT === 'number' ? editForm.priceWithoutVAT : undefined,
      priceWithVAT: typeof editForm.priceWithVAT === 'number' ? editForm.priceWithVAT : undefined,
      costPrice: typeof editForm.costPrice === 'number' ? editForm.costPrice : undefined,
      brand: editForm.brand || undefined,
      quantity: quantity,
      summary: editForm.summary || undefined,
      description: editForm.description || undefined,
      lastUpdated: new Date().toISOString(),
    };

    setProducts(prevProducts =>
      prevProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setSelectedProduct(updatedProduct);
    setIsEditing(false);
    toast({ title: 'Success', description: `${updatedProduct.name} updated.` });
  };
  
  const updateStockQuantity = useCallback((productId: string, change: number) => {
    setProducts(prevProducts => {
      const newProducts = prevProducts.map(p =>
        p.id === productId
          ? { ...p, quantity: Math.max(0, p.quantity + change), lastUpdated: new Date().toISOString() }
          : p
      );
      
      if (selectedProduct && selectedProduct.id === productId) {
        const updatedSelected = newProducts.find(p => p.id === productId);
        setSelectedProduct(updatedSelected || null);
      }
      return newProducts;
    });
  }, [selectedProduct]);


  return (
    <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8 bg-background font-body">
      <header className="mb-6">
        <Card className="shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-card border-b">
            <CardTitle className="text-3xl font-bold font-headline text-primary flex items-center">
              <Icons.logo className="h-10 w-10 mr-3 text-primary" /> Stock Manager
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm">
                  <Icons.apk className="mr-2 h-4 w-4" /> Get APK Info
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Android APK Information</DialogTitle>
                </DialogHeader>
                <DialogDescription className="space-y-2 py-2">
                  <p>This application is a web-based tool. To use it like an app on Android:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Open this page in Chrome on your Android device.</li>
                    <li>Tap the three dots (menu) in the top-right corner.</li>
                    <li>Select "Add to Home screen".</li>
                  </ol>
                  <p>This will create an icon on your home screen, allowing you to launch it like a native app (Progressive Web App - PWA).</p>
                  <p>Direct APK generation is not a feature of this web application. For a true APK, technologies like Capacitor or Cordova would be needed to wrap the web app.</p>
                </DialogDescription>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-3 items-stretch">
            <Button onClick={() => fileInputRef.current?.click()} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
              <Icons.upload className="mr-2 h-5 w-5" /> Import CSV
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
            <Button onClick={handleExportCSV} className="w-full shadow-md">
              <Icons.download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </CardContent>
        </Card>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="shadow-lg rounded-lg h-full flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="font-headline text-xl">Product List</CardTitle>
              <div className="relative mt-3">
                <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Icons.barcode className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, code, or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 text-base py-2.5 rounded-md shadow-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ScrollArea className="h-[calc(100vh-420px)] md:h-[calc(100vh-360px)]">
                {filteredProducts.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {filteredProducts.map(product => (
                      <li key={product.id}
                          className={`p-4 hover:bg-secondary/70 transition-colors duration-150 cursor-pointer ${selectedProduct?.id === product.id ? 'bg-secondary shadow-inner' : ''}`}
                          onClick={() => handleProductSelect(product)}>
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-grow overflow-hidden">
                            <p className="font-semibold text-primary truncate" title={product.name}>{product.name}</p>
                            <p className="text-sm text-muted-foreground">Code: {product.code} {product.isActive ? <span className="text-green-600">(Active)</span> : <span className="text-red-600">(Inactive)</span>}</p>
                          </div>
                           <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); updateStockQuantity(product.id, -1); }} aria-label="Decrease stock">
                                <Icons.remove className="h-5 w-5 text-destructive hover:text-destructive/80" />
                            </Button>
                            <span className="font-semibold w-10 text-center text-lg">{product.quantity}</span>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); updateStockQuantity(product.id, 1); }} aria-label="Increase stock">
                                <Icons.add className="h-5 w-5 text-green-600 hover:text-green-600/80" />
                            </Button>
                            <Button variant="outline" size="sm" className="ml-2" onClick={(e) => { e.stopPropagation(); handleProductSelect(product); }} aria-label="Edit product">
                                <Icons.edit className="h-4 w-4" />
                            </Button>
                           </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                    <Icons.package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <p className="text-lg">
                      {products.length === 0 ? "Import a CSV file to see your products." : "No products match your search."}
                    </p>
                    {products.length === 0 && <p className="text-sm">Click "Import CSV" to get started.</p>}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          {isEditing && selectedProduct && (
            <Dialog open={isEditing} onOpenChange={(open) => { if(!open) setIsEditing(false); }}>
              <DialogContent className="sm:max-w-[520px] rounded-lg shadow-xl">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl text-primary">Edit: {selectedProduct.name}</DialogTitle>
                  <DialogDescription>
                    Modify product details. Changes are saved locally.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-1">
                <div className="grid gap-5 py-4 pr-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right font-medium">ID (Code)</Label>
                    <Input id="code" name="code" value={editForm.code || ''} onChange={handleEditFormChange} className="col-span-3 text-base" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right font-medium">Name*</Label>
                    <Input id="name" name="name" value={editForm.name || ''} onChange={handleEditFormChange} className="col-span-3 text-base" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isActive" className="text-right font-medium">Active</Label>
                    <Switch
                        id="isActive"
                        checked={editForm.isActive ?? false}
                        onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                        className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categories" className="text-right font-medium">Categories</Label>
                    <Input id="categories" name="categories" value={editForm.categories || ''} onChange={handleEditFormChange} className="col-span-3 text-base" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="brand" className="text-right font-medium">Brand</Label>
                    <Input id="brand" name="brand" value={editForm.brand || ''} onChange={handleEditFormChange} className="col-span-3 text-base" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right font-medium">Quantity*</Label>
                    <Input id="quantity" name="quantity" type="number" value={editForm.quantity ?? 0} onChange={handleEditFormChange} className="col-span-3 text-base" min="0"/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priceWithoutVAT" className="text-right font-medium">Price w/o VAT</Label>
                    <Input id="priceWithoutVAT" name="priceWithoutVAT" type="number" step="0.01" value={editForm.priceWithoutVAT ?? ''} onChange={handleEditFormChange} className="col-span-3 text-base" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priceWithVAT" className="text-right font-medium">Price w/ VAT</Label>
                    <Input id="priceWithVAT" name="priceWithVAT" type="number" step="0.01" value={editForm.priceWithVAT ?? ''} onChange={handleEditFormChange} className="col-span-3 text-base" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="costPrice" className="text-right font-medium">Cost Price</Label>
                    <Input id="costPrice" name="costPrice" type="number" step="0.01" value={editForm.costPrice ?? ''} onChange={handleEditFormChange} className="col-span-3 text-base" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="summary" className="text-right font-medium pt-2">Summary</Label>
                    <Textarea id="summary" name="summary" value={editForm.summary || ''} onChange={handleEditFormChange} className="col-span-3 text-base" rows={3}/>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right font-medium pt-2">Description</Label>
                    <Textarea id="description" name="description" value={editForm.description || ''} onChange={handleEditFormChange} className="col-span-3 text-base" rows={5}/>
                  </div>
                  <p className="text-sm text-muted-foreground text-center col-span-4 pt-2 border-t">
                    Last Updated: {format(new Date(selectedProduct.lastUpdated), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                </ScrollArea>
                <DialogFooter className="gap-2 sm:gap-0 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="shadow-sm">Cancel</Button>
                  <Button onClick={handleUpdateProduct} className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"><Icons.save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {!isEditing && selectedProduct && (
             <Card className="shadow-lg rounded-lg sticky top-6">
              <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                  <Icons.package className="h-7 w-7" /> 
                  <span className="truncate" title={selectedProduct.name}>{selectedProduct.name}</span>
                </CardTitle>
                <CardDescription>
                  Code: {selectedProduct.code} | Status: <span className={selectedProduct.isActive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{selectedProduct.isActive ? "Active" : "Inactive"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <p className="text-4xl font-bold text-center">{selectedProduct.quantity} <span className="text-2xl font-normal text-muted-foreground">in stock</span></p>
                
                {selectedProduct.brand && <p className="text-sm"><span className="font-semibold text-muted-foreground">Brand:</span> {selectedProduct.brand}</p>}
                {selectedProduct.categories && <p className="text-sm"><span className="font-semibold text-muted-foreground">Categories:</span> {selectedProduct.categories}</p>}
                
                <div className="grid grid-cols-3 gap-2 text-sm text-center pt-2 border-t">
                    <div>
                        <p className="font-semibold text-muted-foreground">Price (w/o VAT)</p>
                        <p>{selectedProduct.priceWithoutVAT?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Price (w/ VAT)</p>
                        <p>{selectedProduct.priceWithVAT?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Cost Price</p>
                        <p>{selectedProduct.costPrice?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                </div>

                {selectedProduct.summary && (
                    <div className="pt-2 border-t">
                        <h4 className="font-semibold text-muted-foreground">Summary:</h4>
                        <p className="text-sm whitespace-pre-wrap">{selectedProduct.summary}</p>
                    </div>
                )}
                {selectedProduct.description && (
                    <div className="pt-2 border-t">
                        <h4 className="font-semibold text-muted-foreground">Description:</h4>
                        <ScrollArea className="h-24">
                           <p className="text-sm whitespace-pre-wrap pr-2">{selectedProduct.description}</p>
                        </ScrollArea>
                    </div>
                )}

                <p className="text-xs text-muted-foreground mt-4 text-center border-t pt-3">
                  Last Updated: {format(new Date(selectedProduct.lastUpdated), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => { setEditForm({ ...selectedProduct }); setIsEditing(true); }} className="w-full shadow-md">
                  <Icons.edit className="mr-2 h-4 w-4" /> Edit Product
                </Button>
              </CardFooter>
            </Card>
          )}
          {!selectedProduct && !isEditing && (
            <Card className="shadow-lg rounded-lg h-full flex flex-col items-center justify-center text-center sticky top-6">
              <CardContent className="p-6">
                <Icons.info className="h-16 w-16 text-primary/70 mx-auto mb-6" />
                <p className="text-lg text-muted-foreground font-semibold">Select a product</p>
                <p className="text-sm text-muted-foreground mt-1">Click on a product from the list to view its details or make changes.</p>
                <p className="text-sm text-muted-foreground mt-4">New here? Click "Import CSV" to load your stock data.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Stock Manager. Built with Next.js and ShadCN UI.</p>
      </footer>
    </div>
  );
};

export default StockManagerClient;

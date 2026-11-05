'use client';
import { useState } from 'react';
import { createListing,updateListing } from '@/app/listings/actions';
import type { Listing } from '@prisma/client';

export default function ListingForm({mode,listing,organizations=[]}:{mode:'create'|'edit';listing?:Listing;organizations?:{id:string;name:string}[]}){
  const [description,setDescription]=useState(listing?.description??'');
  const [loading,setLoading]=useState(false);

  async function generate(formData:FormData){
    setLoading(true);
    const response=await fetch('/api/ai/listing-copy',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(formData.entries()))});
    const data=await response.json();
    setDescription(data.description??'');
    setLoading(false);
  }

  return (
    <form action={mode==='create'?createListing:updateListing} className="card mt-10">
      {listing&&<input type="hidden" name="id" value={listing.id} />}
      <div className="grid gap-5 md:grid-cols-2">
        {organizations.length>0&&<div className="space-y-1 md:col-span-2"><label className="label">Workspace</label>
          <select name="organizationId" defaultValue={listing?.organizationId??''} className="input"><option value="">Personal listing</option>
            {organizations.map(organization=><option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></div>}
        <div className="space-y-1 md:col-span-2"><label className="label">Title</label><input name="title" defaultValue={listing?.title} className="input" required /></div>
        <div className="space-y-1"><label className="label">Property type</label><select name="propertyType" defaultValue={listing?.propertyType} className="input"><option>Apartment</option><option>House</option><option>Duplex</option><option>Studio</option><option>Townhouse</option></select></div>
        <div className="space-y-1"><label className="label">Listing type</label><select name="listingType" defaultValue={listing?.listingType} className="input"><option value="RENT">For rent</option><option value="SALE">For sale</option></select></div>
        <div className="space-y-1"><label className="label">Price</label><input name="price" type="number" defaultValue={listing?.price} className="input" required /></div>
        <div className="space-y-1"><label className="label">Area (m²)</label><input name="areaSqm" type="number" defaultValue={listing?.areaSqm} className="input" /></div>
        <div className="space-y-1"><label className="label">Bedrooms</label><input name="bedrooms" type="number" defaultValue={listing?.bedrooms} className="input" required /></div>
        <div className="space-y-1"><label className="label">Bathrooms</label><input name="bathrooms" type="number" defaultValue={listing?.bathrooms} className="input" required /></div>
        <div className="space-y-1"><label className="label">City</label><input name="city" defaultValue={listing?.city} className="input" required /></div>
        <div className="space-y-1"><label className="label">Neighborhood</label><input name="neighborhood" defaultValue={listing?.neighborhood} className="input" required /></div>
        <div className="space-y-1 md:col-span-2"><label className="label">Address</label><input name="address" defaultValue={listing?.address} className="input" required /></div>
        <div className="space-y-1"><label className="label">Latitude</label><input name="latitude" type="number" step="any" defaultValue={listing?.latitude??''} className="input" /></div>
        <div className="space-y-1"><label className="label">Longitude</label><input name="longitude" type="number" step="any" defaultValue={listing?.longitude??''} className="input" /></div>
        <div className="space-y-1 md:col-span-2"><label className="label">Amenities</label><input name="amenities" defaultValue={listing?.amenities} className="input" /></div>
        <div className="space-y-1"><label className="label">AI tone</label><select name="tone" className="input"><option value="warm">Warm</option><option value="premium">Premium</option><option value="family">Family</option><option value="investor">Investor</option></select></div>
        <div className="space-y-1"><label className="label">Image URL</label><input name="imageUrl" defaultValue={listing?.imageUrl??''} className="input" /></div>
        <div className="md:col-span-2"><button type="button" onClick={e=>{if(e.currentTarget.form)void generate(new FormData(e.currentTarget.form));}} className="btn-ghost" disabled={loading}>{loading?'Writing…':'Generate AI description'}</button></div>
        <div className="space-y-1 md:col-span-2"><label className="label">Description</label>
          <textarea name="description" rows={8} className="input" value={description} onChange={e=>setDescription(e.target.value)} required /></div>
        {mode==='edit'&&<div className="space-y-1 md:col-span-2"><label className="label">Status</label>
          <select name="status" defaultValue={listing?.status} className="input"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>}
      </div>
      <button className="btn-primary mt-7 w-full">{mode==='create'?'Publish listing':'Save changes'}</button>
    </form>
  );
}

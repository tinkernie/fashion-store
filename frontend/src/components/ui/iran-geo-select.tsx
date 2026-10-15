"use client";

import React, { useEffect, useState } from "react";
import { Building, Loader2 } from "lucide-react";
import {
  fetchProvinces,
  fetchCities,
  Province,
  City,
} from "@/lib/address-shipping-api";

interface IranGeoSelectProps {
  provinceId?: number;
  cityId?: number;
  onProvinceChange: (province: Province | null) => void;
  onCityChange: (city: City | null) => void;
  provinceError?: string;
  cityError?: string;
  disabled?: boolean;
}

export function IranGeoSelect({
  provinceId,
  cityId,
  onProvinceChange,
  onCityChange,
  provinceError,
  cityError,
  disabled = false,
}: IranGeoSelectProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Load provinces on initial render
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoadingProvinces(true);
      try {
        const data = await fetchProvinces();
        if (isMounted) {
          setProvinces(data);
        }
      } catch (e) {
        console.error("Failed to load Iranian provinces:", e);
      } finally {
        if (isMounted) {
          setIsLoadingProvinces(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load cities whenever provinceId changes
  useEffect(() => {
    let isMounted = true;
    if (!provinceId) {
      setCities([]);
      return;
    }

    async function load() {
      setIsLoadingCities(true);
      try {
        const data = await fetchCities(provinceId!);
        if (isMounted) {
          setCities(data);
        }
      } catch (e) {
        console.error(`Failed to load cities for province ${provinceId}:`, e);
      } finally {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [provinceId]);

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onProvinceChange(null);
      onCityChange(null);
      return;
    }
    const pid = Number(val);
    const found = provinces.find((p) => p.id === pid) || null;
    onProvinceChange(found);
    onCityChange(null);
  };

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onCityChange(null);
      return;
    }
    const cid = Number(val);
    const found = cities.find((c) => c.id === cid) || null;
    onCityChange(found);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Province Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            استان
          </span>
          {isLoadingProvinces && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
              <Loader2 className="w-3 h-3 animate-spin text-[#0082CA]" />
              در حال دریافت...
            </span>
          )}
        </label>
        <div className="relative">
          <select
            value={provinceId ? String(provinceId) : ""}
            onChange={handleProvinceSelect}
            disabled={disabled || isLoadingProvinces}
            className={`w-full h-12 px-3 text-sm rounded-xl bg-sky-50/60 border transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0082CA] text-slate-800 ${
              provinceError ? "border-rose-400 bg-rose-50/30" : "border-sky-200"
            }`}
          >
            <option value="">انتخاب استان...</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {provinceError && (
          <p className="text-rose-500 text-xs mt-1">{provinceError}</p>
        )}
      </div>

      {/* City Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            شهر
          </span>
          {isLoadingCities && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
              <Loader2 className="w-3 h-3 animate-spin text-[#0082CA]" />
              در حال بارگذاری...
            </span>
          )}
        </label>
        <div className="relative">
          <select
            value={cityId ? String(cityId) : ""}
            onChange={handleCitySelect}
            disabled={disabled || !provinceId || isLoadingCities}
            className={`w-full h-12 px-3 text-sm rounded-xl bg-sky-50/60 border transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0082CA] text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed ${
              cityError ? "border-rose-400 bg-rose-50/30" : "border-sky-200"
            }`}
          >
            <option value="">
              {!provinceId ? "ابتدا استان را انتخاب کنید" : "انتخاب شهر..."}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {cityError && <p className="text-rose-500 text-xs mt-1">{cityError}</p>}
      </div>
    </div>
  );
}

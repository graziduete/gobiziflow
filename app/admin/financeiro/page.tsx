"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Settings,
  FileText,
  Calculator
} from "lucide-react";
import Link from "next/link";

export default function FinanceiroPage() {
  return (
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
                Módulo Financeiro
              </h2>
              <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-green-500" />
                Gestão financeira completa com DRE e relatórios
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de funcionalidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* DRE */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] border border-slate-200/50 bg-white/80 backdrop-blur-sm group rounded-2xl">
          {/* Fundo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-500" />
          
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10 p-6">
            <div className="space-y-2">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-indigo-600 group-hover:to-blue-800 transition-all duration-300">
                DRE
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 font-medium">
                Demonstrativo de Resultados
              </CardDescription>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 p-6 pt-0">
            <p className="text-sm text-slate-600 mb-4">
              Gerencie o Demonstrativo de Resultados do Exercício com dados anuais e trimestrais.
            </p>
            <Button asChild variant="outline" className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200 group/btn">
              <Link href="/admin/financeiro/dre">
                <BarChart3 className="h-4 w-4 mr-2" />
                Acessar DRE
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Receitas */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] border border-slate-200/50 bg-white/80 backdrop-blur-sm group rounded-2xl">
          {/* Fundo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-500" />
          
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10 p-6">
            <div className="space-y-2">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent group-hover:from-green-600 group-hover:via-emerald-600 group-hover:to-green-800 transition-all duration-300">
                Receitas
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 font-medium">
                Gestão de receitas
              </CardDescription>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 p-6 pt-0">
            <p className="text-sm text-slate-600 mb-4">
              Controle e gerencie todas as receitas da empresa por categoria e período.
            </p>
            <Button asChild variant="outline" className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200 group/btn">
              <Link href="/admin/financeiro/receitas">
                <TrendingUp className="h-4 w-4 mr-2" />
                Gerenciar
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] border border-slate-200/50 bg-white/80 backdrop-blur-sm group rounded-2xl">
          {/* Fundo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-full blur-2xl group-hover:from-red-500/20 group-hover:to-pink-500/20 transition-all duration-500" />
          
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10 p-6">
            <div className="space-y-2">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-red-900 to-pink-900 bg-clip-text text-transparent group-hover:from-red-600 group-hover:via-pink-600 group-hover:to-red-800 transition-all duration-300">
                Despesas
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 font-medium">
                Gestão de despesas
              </CardDescription>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 group-hover:from-red-500/20 group-hover:to-pink-500/20 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 p-6 pt-0">
            <p className="text-sm text-slate-600 mb-4">
              Monitore e controle todas as despesas operacionais e administrativas.
            </p>
            <Button asChild variant="outline" className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200 group/btn">
              <Link href="/admin/financeiro/despesas">
                <FileText className="h-4 w-4 mr-2" />
                Gerenciar
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Categorias */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-[0_6px_30px_-12px_rgba(15,23,42,0.18)] hover:scale-[1.01] hover:ring-1 hover:ring-slate-200/70 active:scale-[.99] border border-slate-200/50 bg-white/80 backdrop-blur-sm group rounded-2xl">
          {/* Fundo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full blur-2xl group-hover:from-purple-500/20 group-hover:to-violet-500/20 transition-all duration-500" />
          
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10 p-6">
            <div className="space-y-2">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-violet-900 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:via-violet-600 group-hover:to-purple-800 transition-all duration-300">
                Categorias
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 font-medium">
                Configuração de categorias
              </CardDescription>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 group-hover:from-purple-500/20 group-hover:to-violet-500/20 transition-all duration-300 group-hover:scale-110 shadow-sm">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 p-6 pt-0">
            <p className="text-sm text-slate-600 mb-4">
              Configure e gerencie as categorias financeiras para receitas e despesas.
            </p>
            <Button asChild variant="outline" className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-200 group/btn">
              <Link href="/admin/financeiro/categorias">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

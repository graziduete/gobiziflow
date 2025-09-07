# 🗂️ CONFIGURAÇÃO DO STORAGE NO SUPABASE

## 📍 **ONDE CONFIGURAR:**

### **1. Acesse seu projeto Supabase:**
- Vá para: https://supabase.com
- Faça login e clique no seu projeto

### **2. Vá em Storage:**
- No menu lateral esquerdo, clique em **"Storage"**

### **3. Crie um novo bucket:**
- Clique em **"New bucket"**
- **Nome do bucket:** `company-logos`
- **Public bucket:** ✅ Marque como público
- **File size limit:** 5MB (ou o limite que preferir)
- **Allowed MIME types:** `image/*`

### **4. Configure as políticas de acesso (RLS):**
- Clique no bucket `company-logos`
- Vá em **"Policies"**
- Clique em **"New Policy"**

#### **Política para INSERT (upload):**
```sql
-- Nome: "Allow authenticated users to upload logos"
-- Target roles: authenticated
-- Policy definition:
(auth.role() = 'authenticated')
```

#### **Política para SELECT (visualização):**
```sql
-- Nome: "Allow public access to view logos"
-- Target roles: public
-- Policy definition:
(true)
```

## 🚀 **DEPOIS DE CONFIGURAR:**

1. **Teste o upload** no formulário de empresas
2. **Verifique se as imagens** aparecem corretamente
3. **Teste o preview** antes de salvar

## ❓ **PRECISA DE AJUDA?**

Se não conseguir configurar o storage, me envie um print da tela do Supabase que eu te ajudo! 
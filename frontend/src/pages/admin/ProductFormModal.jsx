import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button'
import { Field, MoneyInput, Select, TextArea, TextInput, Toggle } from '../../components/Form'
import Modal from '../../components/Modal'
import { adminApi } from '../../services/endpoints'

/** Formulario corto: nombre, categoría, precio, foto, disponibilidad y descripción opcional. */
export default function ProductFormModal({ product, categories, defaultCategoryId, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    category_id: product?.category_id ?? defaultCategoryId ?? '',
    price: product?.price ?? null,
    description: product?.description ?? '',
    is_available: product?.is_available ?? true,
  })
  const [image, setImage] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [preview, setPreview] = useState(product?.image_url ?? null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null)

  // Libera la vista previa local al cambiarla o cerrar el formulario.
  useEffect(() => () => preview?.startsWith('blob:') && URL.revokeObjectURL(preview), [preview])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    const data = new FormData()
    data.append('name', form.name.trim())
    data.append('category_id', form.category_id)
    data.append('price', form.price ?? '')
    data.append('description', form.description.trim())
    data.append('is_available', form.is_available ? '1' : '0')
    data.append('is_active', product ? (product.is_active ? '1' : '0') : '1')
    if (image) data.append('image', image)
    if (removeImage) data.append('remove_image', '1')

    try {
      const result = await adminApi.saveProduct(data, product?.id)
      onSaved(result.message)
    } catch (error) {
      setErrors({ ...error.errors, general: Object.keys(error.errors).length ? null : error.message })
      setSaving(false)
    }
  }

  const err = (key) => errors[key]?.[0]
  const food = categories.filter((c) => c.section === 'comida')
  const drinks = categories.filter((c) => c.section === 'bebida')

  return (
    <Modal title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form onSubmit={save} className="space-y-5">
        <Field label="Nombre" error={err('name')}>
          <TextInput value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Ej: Pollo a la plancha" autoFocus maxLength={80} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Categoría" error={err('category_id')}>
            <Select value={form.category_id} onChange={(e) => set('category_id')(e.target.value)}>
              <option value="">Elija una categoría…</option>
              <optgroup label="Comida">
                {food.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Bebidas">
                {drinks.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>
          <Field label="Precio" error={err('price')}>
            <MoneyInput value={form.price} onChange={set('price')} placeholder="25.000" />
          </Field>
        </div>

        <Field label="Foto (opcional)" error={err('image')}>
          <div className="flex flex-wrap items-center gap-3">
            {preview && !removeImage && <img src={preview} alt="" className="size-24 rounded-2xl object-cover ring-2 ring-slate-200" />}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setImage(file)
                setPreview(URL.createObjectURL(file))
                setRemoveImage(false)
              }}
            />
            <Button variant="secondary" icon="📷" onClick={() => fileInput.current?.click()}>
              {preview && !removeImage ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            {preview && !removeImage && (
              <Button
                variant="ghost"
                onClick={() => {
                  setImage(null)
                  setPreview(null)
                  setRemoveImage(true)
                  if (fileInput.current) fileInput.current.value = ''
                }}
              >
                🗑️ Quitar foto
              </Button>
            )}
          </div>
        </Field>

        <Field label="Disponibilidad">
          <Toggle
            value={form.is_available}
            onChange={set('is_available')}
            options={[
              { value: true, label: '🟢 Disponible', activeClass: 'border-emerald-600 bg-emerald-600 text-white' },
              { value: false, label: '🔴 Agotado', activeClass: 'border-red-600 bg-red-600 text-white' },
            ]}
          />
        </Field>

        <Field label="Descripción (opcional)" error={err('description')}>
          <TextArea value={form.description} onChange={(e) => set('description')(e.target.value)} maxLength={255} placeholder="Ej: Con papas y ensalada" />
        </Field>

        {errors.general && <p className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">❌ {errors.general}</p>}

        <Button type="submit" variant="success" size="xl" block icon="💾" loading={saving}>
          Guardar producto
        </Button>
      </form>
    </Modal>
  )
}

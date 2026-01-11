import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryEditModal from '@/components/admin/CategoryEditModal.vue'
import { createTestI18n, createMockCategory, createMockFile, createTestPinia } from '../../utils/test-helpers'
import { useCategoriesStore } from '@/stores/categories'

// Mock the categories store
vi.mock('@/stores/categories', () => ({
  useCategoriesStore: vi.fn()
}))

describe('CategoryEditModal', () => {
  let i18n: ReturnType<typeof createTestI18n>
  let mockStore: any

  beforeEach(() => {
    i18n = createTestI18n()
    createTestPinia()

    // Setup mock store
    mockStore = {
      createCategory: vi.fn().mockResolvedValue({}),
      updateCategory: vi.fn().mockResolvedValue({})
    }

    vi.mocked(useCategoriesStore).mockReturnValue(mockStore)
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    test('renders add category title when category is null', () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('Add Category')
    })

    test('renders empty form fields', () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const nameDeInput = wrapper.find('#name_de').element as HTMLInputElement
      const nameEnInput = wrapper.find('#name_en').element as HTMLInputElement
      const slugInput = wrapper.find('#slug').element as HTMLInputElement

      expect(nameDeInput.value).toBe('')
      expect(nameEnInput.value).toBe('')
      expect(slugInput.value).toBe('')
    })

    test('auto-generates slug from German name', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const nameDeInput = wrapper.find('#name_de')
      await nameDeInput.setValue('Test Kategorie')
      await nameDeInput.trigger('input')

      const slugInput = wrapper.find('#slug').element as HTMLInputElement
      expect(slugInput.value).toBe('test-kategorie')
    })

    test('handles German umlauts in slug generation', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const nameDeInput = wrapper.find('#name_de')
      await nameDeInput.setValue('Café & Bäckerei')
      await nameDeInput.trigger('input')

      const slugInput = wrapper.find('#slug').element as HTMLInputElement
      expect(slugInput.value).toBe('cafe-baeckerei')
    })

    test('calls createCategory on submit', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('New Category')
      await wrapper.find('#name_en').setValue('New Category EN')
      await wrapper.find('#slug').setValue('new-category')

      await wrapper.find('form').trigger('submit')

      expect(mockStore.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name_de: 'New Category',
          name_en: 'New Category EN',
          slug: 'new-category'
        }),
        undefined
      )
    })

    test('emits save event after successful creation', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('New Category')
      await wrapper.find('#name_en').setValue('New Category EN')
      await wrapper.find('#slug').setValue('new-category')

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('save')
    })
  })

  describe('Edit Mode', () => {
    test('renders edit category title when category is provided', () => {
      const category = createMockCategory()
      const wrapper = mount(CategoryEditModal, {
        props: {
          category
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('Edit Category')
    })

    test('populates form with category data', async () => {
      const category = createMockCategory({
        name_de: 'Existing Category',
        name_en: 'Existing Category EN',
        slug: 'existing-category'
      })

      const wrapper = mount(CategoryEditModal, {
        props: {
          category
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Wait for onMounted hook to populate form
      await wrapper.vm.$nextTick()

      const nameDeInput = wrapper.find('#name_de').element as HTMLInputElement
      const nameEnInput = wrapper.find('#name_en').element as HTMLInputElement
      const slugInput = wrapper.find('#slug').element as HTMLInputElement

      expect(nameDeInput.value).toBe('Existing Category')
      expect(nameEnInput.value).toBe('Existing Category EN')
      expect(slugInput.value).toBe('existing-category')
    })

    test('does not auto-generate slug in edit mode', async () => {
      const category = createMockCategory({
        slug: 'original-slug'
      })

      const wrapper = mount(CategoryEditModal, {
        props: {
          category
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const nameDeInput = wrapper.find('#name_de')
      await nameDeInput.setValue('Changed Name')
      await nameDeInput.trigger('input')

      const slugInput = wrapper.find('#slug').element as HTMLInputElement
      expect(slugInput.value).toBe('original-slug')
    })

    test('calls updateCategory on submit', async () => {
      const category = createMockCategory({
        id: 'cat-123',
        name_de: 'Original Name'
      })

      const wrapper = mount(CategoryEditModal, {
        props: {
          category
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('Updated Name')
      await wrapper.find('form').trigger('submit')

      expect(mockStore.updateCategory).toHaveBeenCalledWith(
        'cat-123',
        expect.objectContaining({
          name_de: 'Updated Name'
        }),
        undefined
      )
    })
  })

  describe('Form Validation', () => {
    test('shows validation error for empty German name', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_en').setValue('Test')
      await wrapper.find('#slug').setValue('test')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('German name is required')
      expect(mockStore.createCategory).not.toHaveBeenCalled()
    })

    test('shows validation error for empty English name', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('Test')
      await wrapper.find('#slug').setValue('test')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('English name is required')
      expect(mockStore.createCategory).not.toHaveBeenCalled()
    })

    test('shows validation error for empty slug', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('Test')
      await wrapper.find('#name_en').setValue('Test')
      await wrapper.find('#slug').setValue('')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('Slug is required')
      expect(mockStore.createCategory).not.toHaveBeenCalled()
    })

    test('shows validation error for invalid slug format', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('Test')
      await wrapper.find('#name_en').setValue('Test')
      await wrapper.find('#slug').setValue('Invalid Slug!')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('Slug must contain only lowercase letters, numbers, and hyphens')
      expect(mockStore.createCategory).not.toHaveBeenCalled()
    })
  })

  describe('Icon Upload', () => {
    test('accepts PNG file upload', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const file = createMockFile('icon.png', 500 * 1024, 'image/png')
      const fileInput = wrapper.find('input[type="file"]')

      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })

      await fileInput.trigger('change')
      await wrapper.vm.$nextTick()

      // Should not show error
      expect(wrapper.text()).not.toContain('Only PNG files are allowed')
    })

    test('rejects non-PNG files', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const file = createMockFile('icon.jpg', 500 * 1024, 'image/jpeg')
      const fileInput = wrapper.find('input[type="file"]')

      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })

      await fileInput.trigger('change')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Only PNG files are allowed')
    })

    test('rejects files larger than 1MB', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const file = createMockFile('icon.png', 2 * 1024 * 1024, 'image/png')
      const fileInput = wrapper.find('input[type="file"]')

      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })

      await fileInput.trigger('change')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('File is too large (max 1MB)')
    })

    test('passes icon file to createCategory', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const file = createMockFile('icon.png', 500 * 1024, 'image/png')
      const fileInput = wrapper.find('input[type="file"]')

      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })

      await fileInput.trigger('change')
      await wrapper.find('#name_de').setValue('Test')
      await wrapper.find('#name_en').setValue('Test')
      await wrapper.find('#slug').setValue('test')
      await wrapper.find('form').trigger('submit')

      expect(mockStore.createCategory).toHaveBeenCalledWith(
        expect.anything(),
        file
      )
    })
  })

  describe('Modal Behavior', () => {
    test('emits close event when cancel button is clicked', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancel')
      await cancelButton?.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('emits close event when backdrop is clicked', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const backdrop = wrapper.find('.fixed.inset-0')
      await backdrop.trigger('click.self')

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('closes on Escape key', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('disables buttons while loading', async () => {
      mockStore.createCategory.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('Test')
      await wrapper.find('#name_en').setValue('Test')
      await wrapper.find('#slug').setValue('test')

      const form = wrapper.find('form')
      await form.trigger('submit')

      const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancel')
      const submitButton = wrapper.findAll('button').find(btn => btn.attributes('type') === 'submit')

      expect(cancelButton?.attributes('disabled')).toBeDefined()
      expect(submitButton?.attributes('disabled')).toBeDefined()
      expect(submitButton?.text()).toContain('Loading')
    })
  })

  describe('Color Picker', () => {
    test('renders color input', () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const colorInput = wrapper.find('input[type="color"]')
      expect(colorInput.exists()).toBe(true)
    })

    test('syncs color input with text input', async () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const colorInput = wrapper.find('input[type="color"]')
      await colorInput.setValue('#FF0000')

      const textInputs = wrapper.findAll('input[type="text"]')
      const colorTextInput = textInputs.find(input => (input.element as HTMLInputElement).placeholder === '#3B82F6')

      // Color inputs normalize to lowercase
      expect((colorTextInput?.element as HTMLInputElement)?.value).toBe('#ff0000')
    })

    test('sets default color for new category', () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const colorInput = wrapper.find('input[type="color"]').element as HTMLInputElement
      // Color inputs normalize to lowercase
      expect(colorInput.value).toBe('#3b82f6')
    })
  })

  describe('Sort Order', () => {
    test('renders sort order input', () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const sortOrderInput = wrapper.find('#sort_order')
      expect(sortOrderInput.exists()).toBe(true)
      expect(sortOrderInput.attributes('type')).toBe('number')
    })

    test('sets default sort order to 0', () => {
      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      const sortOrderInput = wrapper.find('#sort_order').element as HTMLInputElement
      expect(sortOrderInput.value).toBe('0')
    })
  })

  describe('Error Handling', () => {
    test('displays error message on save failure', async () => {
      mockStore.createCategory.mockRejectedValue(new Error('Save failed'))

      const wrapper = mount(CategoryEditModal, {
        props: {
          category: null
        },
        global: {
          plugins: [i18n],
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.find('#name_de').setValue('Test')
      await wrapper.find('#name_en').setValue('Test')
      await wrapper.find('#slug').setValue('test')
      await wrapper.find('form').trigger('submit')

      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Save failed')
    })
  })
})

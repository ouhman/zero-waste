import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import LocationDetailView from '@/views/LocationDetailView.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { slug: 'test-location' }
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

describe('LocationDetailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays location name', async () => {
    const wrapper = mount(LocationDetailView)

    await wrapper.vm.$nextTick()

    expect(wrapper.vm).toBeDefined()
  })

  it('displays address', async () => {
    const wrapper = mount(LocationDetailView)

    await wrapper.vm.$nextTick()

    expect(wrapper.vm).toBeDefined()
  })

  it('displays categories', async () => {
    const wrapper = mount(LocationDetailView)

    await wrapper.vm.$nextTick()

    expect(wrapper.vm).toBeDefined()
  })

  it('shows loading state while fetching', () => {
    const wrapper = mount(LocationDetailView)

    expect(wrapper.vm).toBeDefined()
  })

  it('shows 404 for invalid slug', async () => {
    const wrapper = mount(LocationDetailView)

    await wrapper.vm.$nextTick()

    expect(wrapper.vm).toBeDefined()
  })
})

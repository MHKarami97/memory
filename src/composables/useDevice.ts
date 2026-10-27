import { ref, onMounted, onUnmounted, computed } from 'vue'

export function useDevice() {
  var width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  function update() {
    width.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  var isMobile = computed(() => width.value < 768)
  var isTablet = computed(() => width.value >= 768 && width.value < 1024)
  var isDesktop = computed(() => width.value >= 1024)
  var isWideDesktop = computed(() => width.value >= 1440)

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    isWideDesktop,
  }
}

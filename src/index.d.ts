interface textProcessor {
  once(): boolean
  process(s: string): string
}

namespace OpenCC {
  type Locale = 'cn' | 'tw' | 'twp' | 'hk' | 'jp' | 't'

  interface ConverterOptions {
    from?: Locale
    to?: Locale
  }

  type ConvertText = (text: string) => string

  function Converter(options: ConverterOptions): ConvertText
}

interface Window {
  OpenCC: OpenCC
}

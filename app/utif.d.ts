declare module "utif" {
  type TiffImageDirectory = {
    width?: number;
    height?: number;
    [tag: string]: unknown;
  };

  const UTIF: {
    decode(buffer: ArrayBuffer): TiffImageDirectory[];
    decodeImage(buffer: ArrayBuffer, directory: TiffImageDirectory): void;
    toRGBA8(directory: TiffImageDirectory): Uint8Array;
  };

  export default UTIF;
}

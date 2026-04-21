import Image, { type ImageProps } from 'next/image';

type Props = Omit<ImageProps, 'src'> & {
  srcLight: string;
  srcDark: string;
};

export function ThemeImage({ srcLight, srcDark, ...rest }: Props) {
  return (
    <>
      <Image {...rest} src={srcLight} className="dark:hidden" />
      <Image {...rest} src={srcDark} className="hidden dark:block" />
    </>
  );
}

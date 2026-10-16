import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
export const metadata: Metadata={title:'AMCtrainer',description:'Simple AMC 10, AMC 12 and AIME practice with real contest problems, topic filters, answer checking, and AoPS solutions.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

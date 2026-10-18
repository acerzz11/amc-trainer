import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
export const metadata: Metadata={title:'AMCtrainer',description:'Simple AMC 8, AMC 10, AMC 12, AIME and olympiad practice with real contest problems, topic filters, answer checking, and AoPS solutions.',icons:{icon:{url:'/favicon.svg?v=2',type:'image/svg+xml'}}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

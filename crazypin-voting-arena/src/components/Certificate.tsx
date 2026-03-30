import React, { useRef } from 'react';
import { Crown, Star } from 'lucide-react';

interface CertificateProps {
  winnerName: string;
  isCertificate?: boolean;
}

const Certificate: React.FC<CertificateProps> = ({ winnerName, isCertificate = true }) => {
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Internal resolution for the certificate (9:16 aspect ratio)
  const internalWidth = 360;
  const internalHeight = 601;

  // Calculate scale to fit the viewport
  // We subtract less padding now since download button is gone
  const horizontalScale = (windowSize.width - 48) / internalWidth;
  const verticalScale = (windowSize.height - 120) / internalHeight; 
  const scale = Math.min(horizontalScale, verticalScale, 1); 

  const CertificateContent = () => (
    <div 
      className="relative flex flex-col items-center p-4 box-border select-none rounded-sm overflow-hidden"
      style={{ 
        width: `${internalWidth}px`,
        height: `${internalHeight}px`,
        backgroundColor: '#000000',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Glowing Golden Double Border */}
      <div 
        className="absolute inset-[1.5%] border-[2px] rounded-sm pointer-events-none z-20" 
        style={{ 
          borderColor: '#EAB308', 
          boxShadow: 'inset 0 0 15px rgba(234, 179, 8, 0.4), 0 0 20px rgba(234, 179, 8, 0.3)' 
        }}
      />
      <div 
        className="absolute inset-[3%] border-[0.5px] rounded-sm pointer-events-none z-20" 
        style={{ borderColor: 'rgba(234, 179, 8, 0.5)' }}
      />

      {/* Background Textures (Subtle Rings) */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] border-[1px] rounded-full" style={{ borderColor: '#EAB308' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] border-[1px] rounded-full" style={{ borderColor: '#EAB308' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[60%] border-[0.5px] rounded-full" style={{ borderColor: '#EAB308' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[70%] border-[0.3px] rounded-full" style={{ borderColor: '#EAB308' }} />
      </div>

      {/* 1. Header Section */}
      <div className="relative z-10 mt-6 mb-3 flex flex-col items-center">
        <div className="relative mb-3">
          <Crown size={40} style={{ color: '#EAB308', filter: 'drop-shadow(0 0 15px rgba(234, 179, 8, 0.8))' }} />
          <div className="absolute -inset-2 rounded-full -z-10" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', filter: 'blur(24px)' }} />
        </div>
        <h1 className="font-black text-[11px] tracking-[0.3em] uppercase leading-tight text-center" style={{ color: '#EAB308', textShadow: '0 0 10px rgba(234,179,8,0.3)' }}>
          HALL OF FAME - CRAZY POINT
        </h1>
        <p className="font-bold text-[6px] tracking-[0.4em] uppercase opacity-70 text-center mt-1.5" style={{ color: '#FFFFFF' }}>
          SABSE BADA PAGAL {!isCertificate && "/ ULTIMATE GADHA"}
        </p>
      </div>

      {/* 2. Champion Badge */}
      <div className="relative z-10 mb-4">
        <div 
          className="inline-flex items-center justify-center px-6 py-1.5 rounded-full font-black text-[8.5px] tracking-[0.2em] uppercase"
          style={{ 
            background: 'linear-gradient(135deg, #854D0E 0%, #EAB308 50%, #854D0E 100%)',
            color: '#000000',
            boxShadow: '0 6px 20px rgba(0,0,0,0.8), 0 0 15px rgba(234, 179, 8, 0.3)',
            lineHeight: '1',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          2026 CHAMPION
        </div>
      </div>

      {/* 3. Congratulations Section */}
      <div className="relative z-10 text-center w-full mb-4">
        <p className="font-bold text-[5.5px] tracking-[0.6em] uppercase mb-1.5 opacity-50" style={{ color: '#FFFFFF' }}>CONGRATULATIONS</p>
        <h3 className="font-black text-[22px] tracking-tight uppercase leading-none break-words px-4" style={{ 
          color: '#FFFFFF', 
          textShadow: '0 0 20px rgba(255,255,255,0.5)',
          background: 'linear-gradient(to bottom, #FFFFFF 0%, #D1D5DB 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {winnerName} BHAI!
        </h3>
      </div>

      {/* 4. Main Paragraph */}
      <div className="relative z-10 text-center px-8 mb-4">
        <p className="font-bold text-[8.5px] leading-relaxed italic" style={{ color: '#EAB308', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Tum jeet gaye bosdike! Group ka sabse bada gand faad gadha!<br/>
          Tera dimag toh kab ka ghum gaya, ab toh sirf khali dibba bacha hai 😂
        </p>
      </div>

      {/* 5. Bullet Points (Tight Spacing) */}
      <div className="relative z-10 px-8 mb-4" style={{ width: '330px', height: '137.5px' }}>
        <ul className="space-y-1 font-medium text-[6.2px] leading-tight" style={{ color: '#ffffff' }}>
          <li className="flex gap-2 align-top">
            <span style={{ color: '#EAB308' }} className="shrink-0 mt-0.5 text-[8px]">•</span> 
            <span>Tu jab bhi serious topic pe aata hai, seedha bakchodi shuru kar deta hai jaise "bhai yeh toh alien ka conspiracy hai" bolke sabko pagal bana deta hai!</span>
          </li>
          <li className="flex gap-2 align-top">
            <span style={{ color: '#EAB308' }} className="shrink-0 mt-0.5 text-[8px]">•</span> 
            <span>Tera IQ itna low hai ki negative mein chala gaya, ab calculator bhi bolta hai "error: brain not found"!</span>
          </li>
          <li className="flex gap-2 align-top">
            <span style={{ color: '#EAB308' }} className="shrink-0 mt-0.5 text-[8px]">•</span> 
            <span>Friends group mein sab sochte hain "iska dimag kahan hai?", jawab: shayad toilet flush kar diya tune bachpan mein!</span>
          </li>
          <li className="flex gap-2 align-top">
            <span style={{ color: '#EAB308' }} className="shrink-0 mt-0.5 text-[8px]">•</span> 
            <span>Jo bhi plan banaye, tu bolta hai "arre yaar risk mat lo", phir khud sabse pehle girta hai aur sabko saath le jata hai!</span>
          </li>
          <li className="flex gap-2 align-top">
            <span style={{ color: '#EAB308' }} className="shrink-0 mt-0.5 text-[8px]">•</span> 
            <span>Tera favorite hobby: random time pe "bhai yaad hai woh din..." bolke 4 ghante purani bakaiti karna, jabki sab bore ho chuke hote hain!</span>
          </li>
          <li className="flex gap-2 align-top">
            <span style={{ color: '#EAB308' }} className="shrink-0 mt-0.5 text-[8px]">•</span> 
            <span>Warning: is gadhe ke saath kabhi bhi bet mat lagana, 100% haar jayega aur phir bolega "bhai fix tha"!</span>
          </li>
          <li className="flex gap-2 align-top">
            <span style={{ color: '#EAB308' }} className="shrink-0 mt-0.5 text-[8px]">•</span> 
            <span>Tu group ka official clown hai, bina tujhe ke maza hi nahi aata – lekin tu itna overacting karta hai ki kabhi kabhi lagta hai real mental hospital se bhag aaya hai!</span>
          </li>
        </ul>
      </div>

      {/* 6. Final Note */}
      <div className="relative z-10 text-center px-8 mb-4">
        <p className="font-black text-[8px] leading-tight uppercase tracking-wider mb-1.5" style={{ color: '#EAB308' }}>
          Ab crown pehen le gadhe ki, yeh trophy tera permanent hai!
        </p>
        <p className="font-bold text-[6px] leading-tight opacity-70" style={{ color: '#FFFFFF' }}>
          Voted by your pagal dost as the BIGGEST MADNESS KING of the group!
        </p>
      </div>

      {/* 7. Footer Info */}
      <div className="relative z-10 w-full px-8 mb-3 pt-3 text-center" style={{ borderTop: '1px solid rgba(234, 179, 8, 0.3)' }}>
        <p className="font-bold text-[5.5px] uppercase tracking-[0.25em] mb-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Crazy Point App – Hall of Fame Topper</p>
        <div className="flex items-center justify-center gap-1.5 font-black text-[6.5px] uppercase tracking-[0.15em]" style={{ color: '#EAB308' }}>
          <Star size={5} fill="#EAB308" />
          <span>Never Normal, Always Gadha Level 1000 🔥🐴</span>
          <Star size={5} fill="#EAB308" />
        </div>
      </div>

      {/* Spacer to push signature to bottom */}
      <div className="flex-1" />

      {/* 8. Signature Section */}
      <div className="relative z-10 px-6 pb-4 flex justify-end" style={{ width: '316px', height: '82.25px' }}>
        <div className="text-right">
          <p className="font-bold text-[4.5px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Signature:</p>
          <div className="mb-1 min-w-[65px]">
            <p className="font-signature text-[12px] leading-none text-right" style={{ color: '#FFFFFF' }}>Faheem Jan</p>
            <div className="h-[0.5px] w-full mt-1" style={{ backgroundColor: 'rgba(234, 179, 8, 0.7)' }} />
          </div>
          <p className="font-bold text-[4px] uppercase tracking-widest" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Head of Pagal Department</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full h-screen relative bg-black overflow-y-auto pb-[120px] no-scrollbar">
      {/* Certificate Container with Scaling */}
      <div className="flex-1 flex items-center justify-center w-full px-4">
        <div 
          className="relative origin-center transition-transform duration-300"
          style={{
            transform: `scale(${scale})`,
            width: `${internalWidth}px`,
            height: `${internalHeight}px`
          }}
        >
          <CertificateContent />
        </div>
      </div>
    </div>
  );
};

export default Certificate;

Certificate.displayName = 'Certificate';

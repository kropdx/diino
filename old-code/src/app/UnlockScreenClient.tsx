'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

// --- Icon Components ---
const IconBox = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <path
      d="M21 7.35304L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 7.35304C2.99998 7.13514 3.11812 6.93437 3.3086 6.82855L11.7086 2.16188C11.8898 2.06121 12.1102 2.06121 12.2914 2.16188L20.6914 6.82855C20.8818 6.93437 21 7.13514 21 7.35304Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3.52844 7.29357L11.7086 11.8381C11.8898 11.9388 12.1102 11.9388 12.2914 11.8381L20.5 7.27777"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M12 21L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
const IconDatabase = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <path
      d="M12 2C20 2 20 5 20 5C20 5 20 8 12 8C4 8 4 5 4 5C4 5 4 2 12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
    ></path>
    <path
      d="M12 16C20 16 20 19 20 19C20 19 20 22 12 22C4 22 4 19 4 19C4 19 4 16 12 16Z"
      stroke="currentColor"
      strokeWidth="1.5"
    ></path>
    <path
      d="M20 5V19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M4 5V19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
const IconGrid = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <path
      d="M3 21V3H21V21H3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3 16.5H12H21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3 12H21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3 7.5H21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M16.5 3V12V21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M12 3V21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M7.5 3V21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
const IconStack = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <path
      d="M3.5 6.00398C3.5 7.80795 6.35714 9 11.5 9C18.5 9 19.5 6.00398 19.5 6.00398C19.5 6.00398 18.5 3 11.5 3C6.35714 3 3.5 4.2 3.5 6.00398Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3.5 12.004C3.5 13.808 6.35714 15 11.5 15C18.5 15 19.5 12.004 19.5 12.004C19.5 12.004 18.5 9 11.5 9C6.35714 9 3.5 10.2 3.5 12.004Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3.5 18.004C3.5 19.808 6.35714 21 11.5 21C18.5 21 19.5 18.004 19.5 18.004C19.5 18.004 18.5 15 11.5 15C6.35714 15 3.5 16.2 3.5 18.004Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M19.5 12C19.5 12 20.5 11.025 20.5 9C20.5 6.975 19.5 6 19.5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M20.5 4C20.5 5.35 19.5 6 19.5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M19.5 18C19.5 18 20.5 17.025 20.5 15C20.5 12.975 19.5 12 19.5 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M20.5 20C20.5 18.65 19.5 18 19.5 18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
const IconBoxOpen = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <path
      d="M21 7.35304L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 7.35304C2.99998 7.13514 3.11812 6.93437 3.3086 6.82855L11.7086 2.16188C11.8898 2.06121 12.1102 2.06121 12.2914 2.16188L20.6914 6.82855C20.8818 6.93437 21 7.13514 21 7.35304Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M20.5 16.7222L12.2914 12.1619C12.1102 12.0612 11.8898 12.0612 11.7086 12.1619L3.5 16.7222"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3.52844 7.29357L11.7086 11.8381C11.8898 11.9388 12.1102 11.9388 12.2914 11.8381L20.5 7.27777"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M12 21L12 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
const IconCake = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="currentColor"
    {...props}
  >
    <path
      d="M12 21C7.02944 21 3 19.2091 3 17C3 14.7909 7.02944 13 12 13C16.9706 13 21 14.7909 21 17C21 19.2091 16.9706 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M12 2C13.6569 2 15 3.34315 15 5V6H9V5C9 3.34315 10.3431 2 12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3.5 15.5L7.5 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M20.5 15.5L16.5 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

// --- Configuration ---
const ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  box: IconBox,
  database: IconDatabase,
  grid: IconGrid,
  stack: IconStack,
  'box-open': IconBoxOpen,
  cake: IconCake,
};
const ALL_KEYS = ['box', 'database', 'grid', 'cake', 'stack', 'box-open'];
const ICON_NAMES: Record<string, string> = {
  database: 'VOLUME',
  stack: 'TIME',
  box: 'MATTER',
  cake: 'FLOW',
  grid: 'XY',
  'box-open': 'DIV',
};
const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

// --- Main Unlock Screen Component ---
export default function UnlockScreenClient() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const router = useRouter();
  const [shuffledKeys, setShuffledKeys] = useState<string[]>(ALL_KEYS);

  // Shuffle only on client side after initial render
  useEffect(() => {
    setShuffledKeys(shuffle(ALL_KEYS));
  }, []);

  const handleKeyClick = (key: string, index?: number) => {
    if (typeof index === 'number') {
      // Remove the clicked key from selected at specific index
      const newSelected = [...selectedKeys];
      newSelected.splice(index, 1);
      setSelectedKeys(newSelected);
      return;
    }

    // If we already have 4 keys selected, don't add more
    if (selectedKeys.length >= 4) {
      return;
    }

    // Add key to selected (can add same key multiple times)
    setSelectedKeys([...selectedKeys, key]);
  };

  useEffect(() => {
    if (selectedKeys.length === 4) {
      setStatus('checking');

      // Verify combination server-side
      const verifyCombination = async () => {
        try {
          const response = await fetch('/api/verify-combination', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ combination: selectedKeys }),
          });

          const data = await response.json();

          if (data.success) {
            setStatus('success');
            setIsUnlocked(true);
            // Redirect to sign-up after a short delay
            setTimeout(() => {
              router.push('/sign-up');
            }, 1500);
          } else {
            setStatus('error');
            setTimeout(() => {
              // Reset the game
              setShuffledKeys(shuffle(ALL_KEYS));
              setSelectedKeys([]);
              setStatus('idle');
            }, 1500);
          }
        } catch (error) {
          console.error('Error verifying combination:', error);
          setStatus('error');
          setTimeout(() => {
            // Reset the game
            setShuffledKeys(shuffle(ALL_KEYS));
            setSelectedKeys([]);
            setStatus('idle');
          }, 1500);
        }
      };

      // Add a small delay for UX
      setTimeout(verifyCombination, 500);
    }
  }, [selectedKeys, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 font-sans">
      <AnimatePresence mode="wait">
        {isUnlocked ? (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 uppercase">
              UNLOCKED!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 uppercase">
              REDIRECTING TO SIGN UP...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="locked"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-2 relative">
                <Image
                  src="/diino.png"
                  alt="diino logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <h1 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">
                DIINO SEQUENCER
              </h1>
            </div>

            <motion.div
              animate={{
                x: status === 'error' ? [-5, 5, -5, 5, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
              className={cn(
                'grid grid-cols-4 gap-4 p-4 rounded-lg border-2 border-dashed mb-8 min-h-[116px] transition-colors',
                status === 'idle' && 'border-gray-300 dark:border-gray-600',
                status === 'checking' && 'border-blue-500',
                status === 'error' && 'border-red-500',
                status === 'success' && 'border-green-500'
              )}
            >
              {selectedKeys.map((key, index) => {
                const Icon = ICONS[key];
                return (
                  <button
                    key={`${key}-${index}`}
                    onClick={() => handleKeyClick(key, index)}
                    className="h-[80px] w-[80px] bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors p-2"
                  >
                    <Icon className="w-8 h-8 text-gray-800 dark:text-gray-200" />
                    <span className="text-[10px] mt-1 text-gray-600 dark:text-gray-400 uppercase font-medium">
                      {ICON_NAMES[key]}
                    </span>
                  </button>
                );
              })}
              {Array.from({ length: 4 - selectedKeys.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="h-[80px] w-[80px] bg-gray-100 dark:bg-gray-800/50 rounded-lg flex items-center justify-center"
                >
                  <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                    {selectedKeys.length + index + 1}
                  </span>
                </div>
              ))}
            </motion.div>

            <div className="flex justify-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {shuffledKeys.map((key) => {
                const Icon = ICONS[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleKeyClick(key)}
                    className="h-[60px] w-[60px] bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors p-1"
                  >
                    <Icon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    <span className="text-[9px] mt-0.5 text-gray-600 dark:text-gray-400 uppercase font-medium">
                      {ICON_NAMES[key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-8 mt-4">
              <AnimatePresence>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-center text-red-500 font-medium uppercase"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    INCORRECT COMBINATION. RESETTING...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/sign-in"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline uppercase font-medium"
              >
                EXISTING MEMBERS
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

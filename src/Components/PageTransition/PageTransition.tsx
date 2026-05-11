import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { Transition, Variants } from 'framer-motion';

const pageVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -10 },
};

const pageTransition: Transition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.4,
};

const PageTransition = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                transition={pageTransition}
                style={{ position: 'relative', width: '100%' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default PageTransition;
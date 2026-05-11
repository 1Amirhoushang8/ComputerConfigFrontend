

import { useNavigation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.tsx';
import '../PageLoader/PageLoader.scss';


const OVERLAY_APPEAR_DELAY = 150;
const OVERLAY_FADE_OUT_HOLD = 500;


const PageLoader = ({ children }: { children: React.ReactNode }) => {
    const navigation = useNavigation();
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (navigation.state === 'loading') {

            const appearTimer = setTimeout(() => setIsTransitioning(true), OVERLAY_APPEAR_DELAY);
            return () => clearTimeout(appearTimer);
        } else {

            const disappearTimer = setTimeout(() => setIsTransitioning(false), OVERLAY_FADE_OUT_HOLD);
            return () => clearTimeout(disappearTimer);
        }
    }, [navigation.state]);

    return (
        <div className="page-transition-wrapper" style={{ position: 'relative', height: '100%' }}>
            {isTransitioning && (
                <div className="page-loader-overlay">
                    <LoadingSpinner />
                </div>
            )}
            <div className={`page-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                {children}
            </div>
        </div>
    );
};

export default PageLoader;
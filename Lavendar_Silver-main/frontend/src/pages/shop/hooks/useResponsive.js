import { useState, useEffect } from "react";
export const useResponsive = (breakpoint = 768) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return {
        isMobile: windowWidth < breakpoint,
        isDesktop: windowWidth >= breakpoint,
        width: windowWidth,
    };
};


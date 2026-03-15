"use client";

export function WolfLogo({ size = 28 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 64 64"
			fill="none"
			width={size}
			height={size}
			className="wolf-logo"
		>
			<style>{`
        .wolf-eye-glow {
          animation: eyePulse 3s ease-in-out infinite;
        }
        @keyframes eyePulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; filter: drop-shadow(0 0 3px #4361EE); }
        }
      `}</style>

			{/* Left ear */}
			<path d="M12 30 L22 6 L28 22 Z" fill="#4361EE" />
			{/* Right ear */}
			<path d="M42 6 L52 30 L36 22 Z" fill="#4361EE" />
			{/* Ear inner glow */}
			<path d="M16 26 L22 10 L26 22 Z" fill="#5B7BFF" opacity="0.5" />
			<path d="M42 10 L48 26 L38 22 Z" fill="#5B7BFF" opacity="0.5" />
			{/* Head main shape */}
			<path
				d="M22 6 L42 6 L52 26 L46 44 L38 52 L26 52 L18 44 L12 26 Z"
				fill="#C0C0C8"
			/>
			{/* Head shading (darker lower half) */}
			<path d="M18 44 L26 52 L38 52 L46 44 L44 36 L20 36 Z" fill="#A8A8B2" />
			{/* Snout */}
			<path d="M26 36 L38 36 L35 48 L29 48 Z" fill="#8A8A94" />
			{/* Nose */}
			<path d="M29 38 L35 38 L33 42 L31 42 Z" fill="#1A1A2E" />
			{/* Left eye - pupil */}
			<ellipse cx="25" cy="26" rx="3.5" ry="3" fill="#1A1A2E" />
			{/* Left eye - iris (animated) */}
			<ellipse
				cx="26"
				cy="25.5"
				rx="1.5"
				ry="1.2"
				fill="#4361EE"
				className="wolf-eye-glow"
			/>
			{/* Left eye - highlight (animated) */}
			<circle
				cx="26.5"
				cy="25"
				r="0.6"
				fill="#5B7BFF"
				className="wolf-eye-glow"
			/>
			{/* Right eye - pupil */}
			<ellipse cx="39" cy="26" rx="3.5" ry="3" fill="#1A1A2E" />
			{/* Right eye - iris (animated) */}
			<ellipse
				cx="38"
				cy="25.5"
				rx="1.5"
				ry="1.2"
				fill="#4361EE"
				className="wolf-eye-glow"
			/>
			{/* Right eye - highlight (animated) */}
			<circle
				cx="37.5"
				cy="25"
				r="0.6"
				fill="#5B7BFF"
				className="wolf-eye-glow"
			/>
			{/* Brow lines */}
			<path
				d="M19 22 L25 20"
				stroke="#A8A8B2"
				strokeWidth="1"
				strokeLinecap="round"
			/>
			<path
				d="M45 22 L39 20"
				stroke="#A8A8B2"
				strokeWidth="1"
				strokeLinecap="round"
			/>
		</svg>
	);
}

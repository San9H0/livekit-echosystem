import React from 'react'

const Footer = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-800 text-gray-100 py-3 text-center border-t border-gray-700">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6">
                {/* 왼쪽: 로고 및 저작권 */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center text-white text-sm font-bold">
                            🎥
                        </div>
                        <span className="text-sm font-semibold">
                            LiveKit Conference
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">
                        © {currentYear} All rights reserved.
                    </span>
                </div>

                {/* 중앙: 링크들 */}
                <div className="flex gap-4">
                    <a href="#" className="text-gray-400 text-xs no-underline transition-colors hover:text-blue-400">
                        개인정보처리방침
                    </a>
                    <a href="#" className="text-gray-400 text-xs no-underline transition-colors hover:text-blue-400">
                        이용약관
                    </a>
                    <a href="#" className="text-gray-400 text-xs no-underline transition-colors hover:text-blue-400">
                        고객지원
                    </a>
                </div>

                {/* 오른쪽: 기술 스택 */}
                <div className="text-xs text-gray-400">
                    Powered by <strong className="text-blue-400">LiveKit</strong>
                </div>
            </div>
        </footer>
    )
}

export default Footer 

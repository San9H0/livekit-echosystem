import React from 'react'
import { Button } from './ui/button'
import { Video, Search, Users } from 'lucide-react'

interface SidebarNavigationProps {
}

const SidebarNavigation = ({ }: SidebarNavigationProps) => {
    return (
        <aside className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 py-6 h-[calc(100vh-80px)] overflow-y-auto">
            {/* 메뉴 아이템들 */}
            <div className="px-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
                    메뉴
                </h3>

                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-3 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-slate-800"
                    >
                        <Video className="h-4 w-4" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">Live</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-3 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-slate-800"
                    >
                        <Users className="h-4 w-4" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">Conference</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-3 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-slate-800"
                    >
                        <Search className="h-4 w-4" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">찾기</span>
                    </Button>
                </div>
            </div>

            {/* 하단 정보 */}
            <div className="px-6 mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        안정적인 화상회의를 제공합니다
                    </p>
                </div>
            </div>
        </aside>
    )
}

export default SidebarNavigation 

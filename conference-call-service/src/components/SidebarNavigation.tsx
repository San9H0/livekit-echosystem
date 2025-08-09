import { Video, Search, Users } from 'lucide-react'
import { Box, Flex, Heading, Separator, Text } from '@radix-ui/themes'
import { Button } from './ui/button'

interface SidebarNavigationProps {
}

const SidebarNavigation = ({ }: SidebarNavigationProps) => {
    return (
        <aside>
            <Flex direction="column" height="100%" style={{ width: '16rem' }}>
                <Box p="4">
                    <Heading as="h3" size="3">메뉴</Heading>
                </Box>

                <Box px="4">
                    <Flex direction="column" gap="2">
                        <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 px-4">
                            <Video className="h-4 w-4" />
                            Live
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 px-4">
                            <Users className="h-4 w-4" />
                            Conference
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 px-4">
                            <Search className="h-4 w-4" />
                            찾기
                        </Button>
                    </Flex>
                </Box>

                <Box mt="auto">
                    <Separator />
                    <Box p="4">
                        <Text as="p" size="1" align="center" color="gray">
                            안정적인 화상회의를 제공합니다
                        </Text>
                    </Box>
                </Box>
            </Flex>
        </aside>
    )
}

export default SidebarNavigation 

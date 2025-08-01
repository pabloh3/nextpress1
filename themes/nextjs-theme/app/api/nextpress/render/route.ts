import { NextRequest, NextResponse } from 'next/server'
import { renderToString } from 'react-dom/server'
import HomePageComponent from '@/components/HomePageComponent'
import PostPageComponent from '@/components/PostPageComponent'
import PageComponent from '@/components/PageComponent'

export async function POST(request: NextRequest) {
  try {
    const { template, data } = await request.json()
    
    let component: React.ReactElement
    
    switch (template) {
      case 'home':
      case 'index':
        component = <HomePageComponent posts={data.posts} site={data.site} />
        break
      case 'single-post':
      case 'post':
        component = <PostPageComponent post={data.post} site={data.site} />
        break
      case 'page':
        component = <PageComponent page={data.page} site={data.site} />
        break
      default:
        component = <PostPageComponent post={data.post} site={data.site} />
    }
    
    const html = renderToString(component)
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error rendering Next.js theme:', error)
    return new NextResponse('Error rendering theme', { status: 500 })
  }
} 
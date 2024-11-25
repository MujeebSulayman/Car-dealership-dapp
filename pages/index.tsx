import { EventStruct } from '@/utils/type.dt'
import { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'

const Page: NextPage<{ eventsData: EventStruct[] }> = ({ eventsData }) => {
  const [end, setEnd] = useState<number>(6)
  const [count] = useState<number>(6)
  const [collection, setCollection] = useState<EventStruct[]>([])

  useEffect(() => {
    setCollection(eventsData.slice(0, end))
  }, [eventsData, end])

  return (
    <div>
      <Head>
        <title>Event X</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mt-10 h-20 "></div>
    </div>
  )
}

export default Page

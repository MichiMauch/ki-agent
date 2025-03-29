import { NextResponse } from "next/server";

const MOCO_API_TOKEN = process.env.MOCO_API_TOKEN!;
const MOCO_BASE_URL = "https://netnode.mocoapp.com/api/v1"; // Deine Subdomain!

const headers = {
  Authorization: `Token token=${MOCO_API_TOKEN}`,
  Accept: "application/json",
};

export async function GET() {
    const res = await fetch(`${MOCO_BASE_URL}/users`, {
      method: "GET",
      headers,
    });
  
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          error: "Fehler beim Laden der Personen",
          status: res.status,
          statusText: res.statusText,
          body: text,
        },
        { status: res.status }
      );
    }
  
    const data = await res.json();
  
    // Define the type for a person object
    type Person = {
      id: number;
      name: string;
      email: string;
      active: boolean;
    };
    
    const users = data.map((person: Person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      active: person.active,
    }));
  
    return NextResponse.json({ users });
  }
  

"use client";
import Header from "@/components/header";
import { Contents } from "@/types/content.types";
import { Container, LoadingOverlay, Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [userContent, setUserContent] = useState<Contents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserContent() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch data");

        const data: Contents[] = await response.json();
        setUserContent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserContent();
  }, []);

  const rows = userContent.map(
    ({ id, status, docs_url, created_at, updated_at }, index) => (
      <Table.Tr key={id}>
        <Table.Td>{index + 1}</Table.Td>
        <Table.Td>{id}</Table.Td>
        <Table.Td>{docs_url}</Table.Td>
        <Table.Td>{status}</Table.Td>
        <Table.Td>{created_at}</Table.Td>
        <Table.Td>{updated_at}</Table.Td>
      </Table.Tr>
    )
  );

  if (loading)
    return (
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
    );

  return (
    <Header>
      <Container size="sm">
        <Text>Dashboard</Text>

        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>ID</Table.Th>
              <Table.Th>Url</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>CreatedAt</Table.Th>
              <Table.Th>UpdatedAt</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>

        {/* <Stack>
        {userContent?.map((c) => (
          <Card shadow="sm" key={c.id} p="md">
            <Text size="lg" fw={600}>
              Url: {c.docs_url}
            </Text>
            <Text size="xs" mt="sm">
              Status: {c.status}
            </Text>
          </Card>
        ))}
      </Stack> */}
      </Container>
    </Header>
  );
}

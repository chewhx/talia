import Login from "@/components/login";
import { Center, Container, Text } from "@mantine/core";
import { setUserCookie } from "./actions";
import { version } from "../../package.json";

export default function Home() {
  return (
    <Container size="sm">
      <Center h="97vh">
        <form action={setUserCookie}>
          <Login />
        </form>
      </Center>

      <Center>
        <Text size="sm" fw="bold">
          v{version}
        </Text>
      </Center>
    </Container>
  );
}

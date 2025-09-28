export default async function fetchDataFromIPFS(uri) {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return "";
    throw new Error("IPFS fetch failed: " + error);
  }
}

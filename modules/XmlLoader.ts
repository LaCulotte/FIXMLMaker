export async function loadXmlInput(): Promise<string>
{
    let elem: HTMLInputElement = document.getElementById("xml-input") as HTMLInputElement;
    var file = elem?.files[0];
    if (!file) {
        throw undefined;
    }

    return file.text();
}

export async function loadRemoteXmlFile(path: string) : Promise<string>
{
    return fetch(path)
    .then((res) => {
        return res.text();
    });
}
const { widget } = figma;
const {
  AutoLayout,
  Text,
  Input,
  Rectangle,
  useSyncedState,
  usePropertyMenu,
  currentUser,
  SVG,
} = widget;

interface Response {
  id: string;
  text: string;
  authorName: string;
  authorId: string;
  timestamp: number;
}

const CARD_BG = "#FFFFFF";
const CARD_SHADOW = "#00000022";
const ACCENT = "#7B61FF";
const DANGER = "#FF5C5C";
const BG = "#F0EEFF";
const HIDDEN_BG = "#E2DFF5";
const BORDER = "#C9C4F0";
const TEXT_PRIMARY = "#1A1A2E";
const TEXT_SECONDARY = "#6B6B8A";
const SUCCESS = "#4CAF82";

function BlindPadlet() {
  const [responses, setResponses] = useSyncedState<Response[]>("responses", []);
  const [revealed, setRevealed] = useSyncedState<boolean>("revealed", false);
  const [promptText, setPromptText] = useSyncedState<string>("promptText", "Share your thoughts...");
  const [inputText, setInputText] = useSyncedState<string>("inputText", "");
  const [isOwner, setIsOwner] = useSyncedState<boolean>("isOwner", false);

  // Property menu for the widget owner
  usePropertyMenu(
    [
      {
        itemType: "action",
        tooltip: revealed ? "Hide All Responses" : "Reveal All Responses",
        propertyName: "toggleReveal",
      },
      {
        itemType: "separator",
      },
      {
        itemType: "action",
        tooltip: "Clear All Responses",
        propertyName: "clearAll",
      },
    ],
    ({ propertyName }) => {
      if (propertyName === "toggleReveal") {
        setRevealed(!revealed);
      }
      if (propertyName === "clearAll") {
        setResponses([]);
        setRevealed(false);
      }
    }
  );

  const user = currentUser;
  const userName = user?.name ?? "Anonymous";
  const userId = user?.id ?? "unknown";

  const myResponse = responses.find((r) => r.authorId === userId);
  const hasSubmitted = !!myResponse;

  function submitResponse() {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newResponse: Response = {
      id: `${userId}-${Date.now()}`,
      text: trimmed,
      authorName: userName,
      authorId: userId,
      timestamp: Date.now(),
    };

    // Replace existing response from same user, or add new
    const filtered = responses.filter((r) => r.authorId !== userId);
    setResponses([...filtered, newResponse]);
    setInputText("");
  }

  function deleteMyResponse() {
    setResponses(responses.filter((r) => r.authorId !== userId));
  }

  const visibleResponses = revealed
    ? responses
    : responses.filter((r) => r.authorId === userId);

  const hiddenCount = responses.length - (hasSubmitted ? 1 : 0);

  return (
    <AutoLayout
      direction="vertical"
      spacing={0}
      width={480}
      cornerRadius={16}
      fill={BG}
      stroke={BORDER}
      strokeWidth={1.5}
      effect={[
        {
          type: "drop-shadow",
          color: { r: 0, g: 0, b: 0, a: 0.1 },
          offset: { x: 0, y: 4 },
          blur: 16,
        },
      ]}
    >
      {/* Header */}
      <AutoLayout
        direction="vertical"
        spacing={6}
        padding={{ top: 20, bottom: 16, left: 20, right: 20 }}
        width="fill-parent"
        fill={ACCENT}
        cornerRadius={{ topLeft: 14, topRight: 14, bottomLeft: 0, bottomRight: 0 }}
      >
        <AutoLayout direction="horizontal" spacing="auto" width="fill-parent" verticalAlignItems="center">
          <Text fontSize={18} fontWeight="bold" fill="#FFFFFF" fontFamily="Inter">
            💬 Blind Padlet
          </Text>
          <AutoLayout
            padding={{ top: 4, bottom: 4, left: 10, right: 10 }}
            fill={"#FFFFFF30"}
            cornerRadius={20}
          >
            <Text fontSize={12} fill="#FFFFFF" fontFamily="Inter">
              {responses.length} {responses.length === 1 ? "response" : "responses"}
            </Text>
          </AutoLayout>
        </AutoLayout>

        {/* Editable Prompt */}
        <Input
          value={promptText}
          onTextEditEnd={(e) => setPromptText(e.characters)}
          placeholder="Click to set prompt..."
          fontSize={13}
          fill="#FFFFFFCC"
          fontFamily="Inter"
          width="fill-parent"
          inputBehavior="multiline"
        />
      </AutoLayout>

      {/* Reveal status bar */}
      <AutoLayout
        direction="horizontal"
        spacing={8}
        padding={{ top: 10, bottom: 10, left: 20, right: 20 }}
        width="fill-parent"
        fill={revealed ? "#E8F5EE" : HIDDEN_BG}
        verticalAlignItems="center"
      >
        <Text fontSize={12} fontFamily="Inter" fill={revealed ? SUCCESS : TEXT_SECONDARY}>
          {revealed
            ? "✅ Responses are visible to everyone"
            : `🔒 Responses hidden — ${hiddenCount > 0 ? `${hiddenCount} submitted by others` : "none submitted yet"}`}
        </Text>
      </AutoLayout>

      {/* Input area */}
      <AutoLayout
        direction="vertical"
        spacing={10}
        padding={{ top: 16, bottom: 16, left: 20, right: 20 }}
        width="fill-parent"
        fill={CARD_BG}
      >
        <Text fontSize={12} fontWeight="bold" fill={TEXT_SECONDARY} fontFamily="Inter">
          {hasSubmitted ? `✏️ Update your response (${userName})` : `📝 Your response (${userName})`}
        </Text>
        <AutoLayout
          direction="vertical"
          spacing={0}
          width="fill-parent"
          cornerRadius={10}
          stroke={BORDER}
          strokeWidth={1}
          fill={"#FAFAFA"}
        >
          <Input
            value={inputText}
            onTextEditEnd={(e) => setInputText(e.characters)}
            placeholder="Type your response here..."
            fontSize={13}
            fill={TEXT_PRIMARY}
            fontFamily="Inter"
            width="fill-parent"
            inputBehavior="multiline"
            inputFrameProps={{
              padding: { top: 10, bottom: 10, left: 12, right: 12 },
            }}
          />
        </AutoLayout>

        <AutoLayout direction="horizontal" spacing={8} width="fill-parent">
          {/* Submit button */}
          <AutoLayout
            padding={{ top: 8, bottom: 8, left: 16, right: 16 }}
            fill={ACCENT}
            cornerRadius={8}
            onClick={submitResponse}
            hoverStyle={{ fill: "#6A50EE" }}
          >
            <Text fontSize={13} fontWeight="bold" fill="#FFFFFF" fontFamily="Inter">
              {hasSubmitted ? "Update" : "Submit"}
            </Text>
          </AutoLayout>

          {/* Delete my response */}
          {hasSubmitted && (
            <AutoLayout
              padding={{ top: 8, bottom: 8, left: 12, right: 12 }}
              fill={"#FFF0F0"}
              cornerRadius={8}
              stroke={DANGER}
              strokeWidth={1}
              onClick={deleteMyResponse}
              hoverStyle={{ fill: "#FFE0E0" }}
            >
              <Text fontSize={13} fill={DANGER} fontFamily="Inter">
                Remove mine
              </Text>
            </AutoLayout>
          )}
        </AutoLayout>
      </AutoLayout>

      {/* Divider */}
      <Rectangle width="fill-parent" height={1} fill={BORDER} />

      {/* Responses area */}
      <AutoLayout
        direction="vertical"
        spacing={12}
        padding={{ top: 16, bottom: 20, left: 20, right: 20 }}
        width="fill-parent"
      >
        {visibleResponses.length === 0 && !revealed && (
          <AutoLayout
            direction="vertical"
            spacing={6}
            padding={{ top: 24, bottom: 24, left: 0, right: 0 }}
            width="fill-parent"
            horizontalAlignItems="center"
          >
            <Text fontSize={28}>🤫</Text>
            <Text fontSize={13} fill={TEXT_SECONDARY} fontFamily="Inter" horizontalAlignText="center">
              {hasSubmitted
                ? "Your response is saved.\nWaiting for the host to reveal all responses."
                : "No responses yet. Be the first!"}
            </Text>
          </AutoLayout>
        )}

        {visibleResponses.map((r) => (
          <AutoLayout
            key={r.id}
            direction="vertical"
            spacing={6}
            padding={{ top: 12, bottom: 12, left: 14, right: 14 }}
            width="fill-parent"
            fill={r.authorId === userId ? "#F0EEFF" : CARD_BG}
            cornerRadius={10}
            stroke={r.authorId === userId ? ACCENT : BORDER}
            strokeWidth={r.authorId === userId ? 1.5 : 1}
            effect={[
              {
                type: "drop-shadow",
                color: { r: 0, g: 0, b: 0, a: 0.05 },
                offset: { x: 0, y: 2 },
                blur: 6,
              },
            ]}
          >
            <AutoLayout direction="horizontal" spacing="auto" width="fill-parent" verticalAlignItems="center">
              <Text fontSize={11} fontWeight="bold" fill={r.authorId === userId ? ACCENT : TEXT_SECONDARY} fontFamily="Inter">
                {r.authorId === userId ? `👤 ${r.authorName} (you)` : `👤 ${r.authorName}`}
              </Text>
            </AutoLayout>
            <Text
              fontSize={13}
              fill={TEXT_PRIMARY}
              fontFamily="Inter"
              width="fill-parent"
            >
              {r.text}
            </Text>
          </AutoLayout>
        ))}

        {/* Hidden response cards from others (when not revealed) */}
        {!revealed && responses.filter((r) => r.authorId !== userId).length > 0 && (
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            {responses
              .filter((r) => r.authorId !== userId)
              .map((r) => (
                <AutoLayout
                  key={`hidden-${r.id}`}
                  direction="vertical"
                  spacing={6}
                  padding={{ top: 12, bottom: 12, left: 14, right: 14 }}
                  width="fill-parent"
                  fill={HIDDEN_BG}
                  cornerRadius={10}
                  stroke={BORDER}
                  strokeWidth={1}
                >
                  <Text fontSize={11} fontWeight="bold" fill={TEXT_SECONDARY} fontFamily="Inter">
                    🔒 Hidden response
                  </Text>
                  <Text fontSize={13} fill={TEXT_SECONDARY} fontFamily="Inter">
                    ••••••••••••••••••
                  </Text>
                </AutoLayout>
              ))}
          </AutoLayout>
        )}

        {/* Owner Reveal Button */}
        <AutoLayout
          direction="horizontal"
          spacing={8}
          width="fill-parent"
          horizontalAlignItems="center"
          padding={{ top: 4, bottom: 0, left: 0, right: 0 }}
        >
          <AutoLayout
            padding={{ top: 10, bottom: 10, left: 20, right: 20 }}
            fill={revealed ? "#FFF0F0" : SUCCESS}
            cornerRadius={10}
            onClick={() => setRevealed(!revealed)}
            hoverStyle={{ fill: revealed ? "#FFE0E0" : "#3D9E70" }}
            effect={[
              {
                type: "drop-shadow",
                color: { r: 0, g: 0, b: 0, a: 0.12 },
                offset: { x: 0, y: 2 },
                blur: 6,
              },
            ]}
          >
            <Text fontSize={13} fontWeight="bold" fill={revealed ? DANGER : "#FFFFFF"} fontFamily="Inter">
              {revealed ? "🙈 Hide All Responses" : "👁 Reveal All Responses"}
            </Text>
          </AutoLayout>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
}

widget.register(BlindPadlet);

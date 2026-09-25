local FireporterImporter = {}

local function toColor3(colorData)
    if not colorData then return Color3.fromRGB(255, 255, 255) end
    return Color3.fromRGB(
        math.clamp(math.floor(colorData.r or 255), 0, 255),
        math.clamp(math.floor(colorData.g or 255), 0, 255),
        math.clamp(math.floor(colorData.b or 255), 0, 255)
    )
end

local function getFontWeight(weightNum)
    local w = tonumber(weightNum) or 400
    if w <= 100 then return Enum.FontWeight.Thin
    elseif w <= 200 then return Enum.FontWeight.ExtraLight
    elseif w <= 300 then return Enum.FontWeight.Light
    elseif w <= 400 then return Enum.FontWeight.Regular
    elseif w <= 500 then return Enum.FontWeight.Medium
    elseif w <= 600 then return Enum.FontWeight.SemiBold
    elseif w <= 700 then return Enum.FontWeight.Bold
    elseif w <= 800 then return Enum.FontWeight.ExtraBold
    else return Enum.FontWeight.Heavy end
end

function FireporterImporter.buildTree(nodeData, parentInstance)
    if not nodeData then return nil end

    local nodeType = nodeData.Type or "Frame"
    local instance = Instance.new(nodeType)

    instance.Name = nodeData.Name or "UIElement"
    instance.BorderSizePixel = 0
    instance.BackgroundTransparency = 1 -- Enforces transparent backgrounds to stop brown boxes

    -- Parse Fireporter Geometry (X/Y -> Scale/Offset)
    if nodeData.Size and nodeData.Size.X and nodeData.Size.Y then
        instance.Size = UDim2.new(
            tonumber(nodeData.Size.X.Scale) or 0, tonumber(nodeData.Size.X.Offset) or 0,
            tonumber(nodeData.Size.Y.Scale) or 0, tonumber(nodeData.Size.Y.Offset) or 0
        )
    end

    if nodeData.Position and nodeData.Position.X and nodeData.Position.Y then
        instance.Position = UDim2.new(
            tonumber(nodeData.Position.X.Scale) or 0, tonumber(nodeData.Position.X.Offset) or 0,
            tonumber(nodeData.Position.Y.Scale) or 0, tonumber(nodeData.Position.Y.Offset) or 0
        )
    end

    if nodeData.AnchorPoint then
        instance.AnchorPoint = Vector2.new(tonumber(nodeData.AnchorPoint.X) or 0, tonumber(nodeData.AnchorPoint.Y) or 0)
    end

    if nodeData.Rotation then
        instance.Rotation = tonumber(nodeData.Rotation) or 0
    end

    -- Handle Fireporter ImageLabels
    if instance:IsA("ImageLabel") or instance:IsA("ImageButton") then
        if nodeData.Image and nodeData.Image ~= "rbxassetid://0" then
            instance.Image = nodeData.Image
        end
    end

    -- Handle Detailed Fireporter Typography
    if nodeData.Text and (instance:IsA("TextLabel") or instance:IsA("TextButton") or instance:IsA("TextBox")) then
        local tData = nodeData.Text
        instance.Text = tData.Text or ""
        instance.TextSize = tonumber(tData.TextSize) or 14
        instance.TextColor3 = toColor3(tData.TextColor3)
        instance.TextTransparency = tonumber(tData.TextTransparency) or 0
        
        -- Override Fireporter's background data so text labels stay completely clean
        instance.BackgroundTransparency = 1 
        
        if tData.TextScaled ~= nil then instance.TextScaled = tData.TextScaled end

        if tData.TextXAlignment then
            pcall(function() instance.TextXAlignment = Enum.TextXAlignment[tData.TextXAlignment] end)
        end
        if tData.TextYAlignment then
            pcall(function() instance.TextYAlignment = Enum.TextYAlignment[tData.TextYAlignment] end)
        end

        local weight = getFontWeight(tData.Weight)
        local style = (tData.Style == "Italic") and Enum.FontStyle.Italic or Enum.FontStyle.Normal
        local family = tData.FontFamilyRaw or tData.FontFamily or "Nunito"

        local success, font = pcall(function()
            return Font.fromName(family, weight, style)
        end)
        
        instance.FontFace = (success and font) and font or Font.fromEnum(Enum.Font.FredokaOne)
    end

    -- Recursively build children
    if nodeData.Children and type(nodeData.Children) == "table" then
        for _, childData in ipairs(nodeData.Children) do
            FireporterImporter.buildTree(childData, instance)
        end
    end

    if parentInstance then
        instance.Parent = parentInstance
    end

    return instance
end

return FireporterImporter
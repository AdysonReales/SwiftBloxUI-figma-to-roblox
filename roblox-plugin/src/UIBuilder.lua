local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local StarterGui = game:GetService("StarterGui")
local HttpService = game:GetService("HttpService")

local PropertyMapper = require(script.Parent.PropertyMapper)

local UIBuilder = {}

local VALID_CLASSES = {
	["Frame"] = true,
	["TextLabel"] = true,
	["TextButton"] = true,
	["TextBox"] = true,
	["ImageLabel"] = true,
	["ImageButton"] = true,
	["ScrollingFrame"] = true,
	["CanvasGroup"] = true,
	["ViewportFrame"] = true,
}

-- ... keep the rest of UIBuilder.lua exactly the same ...

local function buildNode(nodeData, parentInstance: Instance): Instance?
	local targetClass = nodeData.ClassName or "Frame"
	if not VALID_CLASSES[targetClass] then
		targetClass = "Frame"
	end

	local instance = Instance.new(targetClass)
	PropertyMapper.applyBasicProperties(instance, nodeData)
	PropertyMapper.applyDecorations(instance, nodeData)

	if instance:IsA("TextLabel") or instance:IsA("TextButton") then
		PropertyMapper.applyTextProperties(instance, nodeData)
	end

	if instance:IsA("ImageLabel") or instance:IsA("ImageButton") then
		PropertyMapper.applyImageProperties(instance, nodeData)
	end

	instance.Parent = parentInstance

	if nodeData.Children and type(nodeData.Children) == "table" then
		for _, childData in ipairs(nodeData.Children) do
			buildNode(childData, instance)
		end
	end

	return instance
end

function UIBuilder.buildFromJSON(rawJson: string): (boolean, string?)
	if not rawJson or rawJson:match("^%s*$") then
		return false, "JSON payload cannot be empty."
	end

	local parsedPayload
	local decodeSuccess, decodeErr = pcall(function()
		parsedPayload = HttpService:JSONDecode(rawJson)
	end)

	if not decodeSuccess or not parsedPayload then
		return false, "JSON Parse Error: " .. tostring(decodeErr)
	end

	local recordingId = nil
	local canRecord = pcall(function()
		recordingId = ChangeHistoryService:TryBeginRecording("SwiftBlox Import")
	end)

	local importFolder = StarterGui:FindFirstChild("SwiftBlox_Imports")
	if not importFolder then
		importFolder = Instance.new("Folder")
		importFolder.Name = "SwiftBlox_Imports"
		importFolder.Parent = StarterGui
	end

	local packageContainer = Instance.new("ScreenGui")
	packageContainer.Name = (parsedPayload.Name or "ImportedUI") .. "_Container"
	packageContainer.ResetOnSpawn = false
	packageContainer.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	packageContainer.Parent = importFolder

	local buildSuccess, rootInstanceOrErr = pcall(function()
		return buildNode(parsedPayload, packageContainer)
	end)

	if not buildSuccess or not rootInstanceOrErr then
		packageContainer:Destroy()
		if recordingId and canRecord then
			ChangeHistoryService:FinishRecording(recordingId, Enum.FinishRecordingOperation.Cancel)
		end
		return false, "Node Generation Error: " .. tostring(rootInstanceOrErr)
	end

	Selection:Set({ rootInstanceOrErr })

	if recordingId and canRecord then
		ChangeHistoryService:FinishRecording(recordingId, Enum.FinishRecordingOperation.Commit)
	else
		ChangeHistoryService:SetWaypoint("SwiftBlox UI Import Complete")
	end

	return true, packageContainer:GetFullName()
end

return UIBuilder